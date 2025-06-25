import os
import uuid
from werkzeug.utils import secure_filename
from PIL import Image
import boto3
from botocore.exceptions import ClientError
import logging
from flask import current_app

logger = logging.getLogger(__name__)


class FileService:
    def __init__(self):
        self.upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
        self.max_file_size = current_app.config.get('MAX_FILE_SIZE', 16 * 1024 * 1024)  # 16MB
        self.allowed_extensions = {
            'images': {'png', 'jpg', 'jpeg', 'gif', 'webp'},
            'documents': {'pdf', 'doc', 'docx', 'txt'},
            'design': {'ai', 'psd', 'eps', 'svg', 'indd'}
        }

        # AWS S3 configuration
        self.use_s3 = current_app.config.get('USE_S3', False)
        if self.use_s3:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=current_app.config.get('AWS_ACCESS_KEY_ID'),
                aws_secret_access_key=current_app.config.get('AWS_SECRET_ACCESS_KEY'),
                region_name=current_app.config.get('AWS_REGION', 'us-east-1')
            )
            self.s3_bucket = current_app.config.get('S3_BUCKET')

        # Ensure upload directory exists
        if not self.use_s3:
            os.makedirs(self.upload_folder, exist_ok=True)

    def allowed_file(self, filename, file_type='images'):
        """Check if file extension is allowed"""
        if '.' not in filename:
            return False

        extension = filename.rsplit('.', 1)[1].lower()
        return extension in self.allowed_extensions.get(file_type, set())

    def generate_filename(self, original_filename):
        """Generate unique filename while preserving extension"""
        if '.' in original_filename:
            name, extension = original_filename.rsplit('.', 1)
            return f"{uuid.uuid4().hex}.{extension.lower()}"
        return f"{uuid.uuid4().hex}"

    def validate_file_size(self, file):
        """Validate file size"""
        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)  # Reset file pointer
        return size <= self.max_file_size

    def resize_image(self, image_path, max_width=1200, max_height=1200, quality=85):
        """Resize image while maintaining aspect ratio"""
        try:
            with Image.open(image_path) as img:
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')

                # Calculate new dimensions
                width, height = img.size
                ratio = min(max_width / width, max_height / height)

                if ratio < 1:  # Only resize if image is larger than max dimensions
                    new_width = int(width * ratio)
                    new_height = int(height * ratio)
                    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

                # Save optimized image
                img.save(image_path, format='JPEG', quality=quality, optimize=True)

            return True
        except Exception as e:
            logger.error(f"Error resizing image: {e}")
            return False

    def upload_file(self, file, file_type='images', resize_images=True):
        """Upload file to local storage or S3"""
        try:
            if not file or file.filename == '':
                return {'success': False, 'message': 'No file provided'}

            if not self.allowed_file(file.filename, file_type):
                return {'success': False, 'message': f'File type not allowed for {file_type}'}

            if not self.validate_file_size(file):
                return {'success': False,
                        'message': f'File size exceeds {self.max_file_size / (1024 * 1024):.1f}MB limit'}

            # Generate secure filename
            filename = self.generate_filename(secure_filename(file.filename))

            if self.use_s3:
                return self._upload_to_s3(file, filename, file_type)
            else:
                return self._upload_to_local(file, filename, file_type, resize_images)

        except Exception as e:
            logger.error(f"Error uploading file: {e}")
            return {'success': False, 'message': f'Upload failed: {str(e)}'}

    def _upload_to_local(self, file, filename, file_type, resize_images=True):
        """Upload file to local storage"""
        try:
            # Create type-specific directory
            type_folder = os.path.join(self.upload_folder, file_type)
            os.makedirs(type_folder, exist_ok=True)

            file_path = os.path.join(type_folder, filename)
            file.save(file_path)

            # Resize images if requested
            if resize_images and file_type == 'images':
                self.resize_image(file_path)

            # Generate URL
            file_url = f"/uploads/{file_type}/{filename}"

            return {
                'success': True,
                'filename': filename,
                'file_path': file_path,
                'file_url': file_url,
                'file_size': os.path.getsize(file_path)
            }

        except Exception as e:
            logger.error(f"Error uploading to local storage: {e}")
            return {'success': False, 'message': str(e)}

    def _upload_to_s3(self, file, filename, file_type):
        """Upload file to AWS S3"""
        try:
            key = f"{file_type}/{filename}"

            # Upload to S3
            self.s3_client.upload_fileobj(
                file,
                self.s3_bucket,
                key,
                ExtraArgs={
                    'ContentType': file.content_type or 'application/octet-stream',
                    'ACL': 'public-read'
                }
            )

            # Generate S3 URL
            file_url = f"https://{self.s3_bucket}.s3.amazonaws.com/{key}"

            return {
                'success': True,
                'filename': filename,
                'file_url': file_url,
                'storage': 's3'
            }

        except ClientError as e:
            logger.error(f"Error uploading to S3: {e}")
            return {'success': False, 'message': 'S3 upload failed'}

    def delete_file(self, file_path_or_url):
        """Delete file from storage"""
        try:
            if self.use_s3 and 's3.amazonaws.com' in file_path_or_url:
                return self._delete_from_s3(file_path_or_url)
            else:
                return self._delete_from_local(file_path_or_url)

        except Exception as e:
            logger.error(f"Error deleting file: {e}")
            return {'success': False, 'message': str(e)}

    def _delete_from_local(self, file_path):
        """Delete file from local storage"""
        try:
            if file_path.startswith('/uploads/'):
                # Convert URL to file path
                file_path = file_path[1:]  # Remove leading slash
                full_path = os.path.join(os.getcwd(), file_path)
            else:
                full_path = file_path

            if os.path.exists(full_path):
                os.remove(full_path)
                return {'success': True, 'message': 'File deleted successfully'}
            else:
                return {'success': False, 'message': 'File not found'}

        except Exception as e:
            logger.error(f"Error deleting local file: {e}")
            return {'success': False, 'message': str(e)}

    def _delete_from_s3(self, file_url):
        """Delete file from S3"""
        try:
            # Extract key from URL
            key = file_url.split(f"{self.s3_bucket}.s3.amazonaws.com/")[1]

            self.s3_client.delete_object(Bucket=self.s3_bucket, Key=key)

            return {'success': True, 'message': 'File deleted from S3'}

        except ClientError as e:
            logger.error(f"Error deleting from S3: {e}")
            return {'success': False, 'message': 'S3 deletion failed'}

    def upload_multiple_files(self, files, file_type='images'):
        """Upload multiple files"""
        results = []

        for file in files:
            result = self.upload_file(file, file_type)
            results.append(result)

        successful_uploads = [r for r in results if r['success']]
        failed_uploads = [r for r in results if not r['success']]

        return {
            'success': len(failed_uploads) == 0,
            'uploaded_files': successful_uploads,
            'failed_files': failed_uploads,
            'total_uploaded': len(successful_uploads),
            'total_failed': len(failed_uploads)
        }

    def get_file_info(self, file_path):
        """Get file information"""
        try:
            if os.path.exists(file_path):
                stat = os.stat(file_path)
                return {
                    'exists': True,
                    'size': stat.st_size,
                    'modified': stat.st_mtime,
                    'is_image': self.allowed_file(file_path, 'images')
                }
            else:
                return {'exists': False}

        except Exception as e:
            logger.error(f"Error getting file info: {e}")
            return {'exists': False, 'error': str(e)}
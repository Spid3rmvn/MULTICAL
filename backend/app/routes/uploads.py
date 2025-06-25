from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.file_service import FileService
from app.utils.validators import admin_required
import os
import logging

logger = logging.getLogger(__name__)

uploads_bp = Blueprint('uploads', __name__)
file_service = FileService()


@uploads_bp.route('/image', methods=['POST'])
@jwt_required()
def upload_image():
    """Upload single image"""
    try:
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No image file provided'
            }), 400

        file = request.files['image']

        if file.filename == '':
            return jsonify({
                'success': False,
                'message': 'No file selected'
            }), 400

        # Upload image
        result = file_service.upload_file(file, file_type='images', resize_images=True)

        if result['success']:
            logger.info(f"Image uploaded successfully by user {get_jwt_identity()}")
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        logger.error(f"Error uploading image: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to upload image'
        }), 500


@uploads_bp.route('/images', methods=['POST'])
@jwt_required()
def upload_multiple_images():
    """Upload multiple images"""
    try:
        if 'images' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No image files provided'
            }), 400

        files = request.files.getlist('images')

        if not files or all(file.filename == '' for file in files):
            return jsonify({
                'success': False,
                'message': 'No files selected'
            }), 400

        # Upload multiple images
        result = file_service.upload_multiple_files(files, file_type='images')

        logger.info(f"Multiple images upload: {result['total_uploaded']} successful, {result['total_failed']} failed")

        return jsonify(result), 200 if result['success'] else 400

    except Exception as e:
        logger.error(f"Error uploading multiple images: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to upload images'
        }), 500


@uploads_bp.route('/document', methods=['POST'])
@jwt_required()
def upload_document():
    """Upload document file"""
    try:
        if 'document' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No document file provided'
            }), 400

        file = request.files['document']

        if file.filename == '':
            return jsonify({
                'success': False,
                'message': 'No file selected'
            }), 400

        # Upload document
        result = file_service.upload_file(file, file_type='documents', resize_images=False)

        if result['success']:
            logger.info(f"Document uploaded successfully by user {get_jwt_identity()}")
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to upload document'
        }), 500


@uploads_bp.route('/design', methods=['POST'])
@jwt_required()
def upload_design_file():
    """Upload design file (AI, PSD, etc.)"""
    try:
        if 'design_file' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No design file provided'
            }), 400

        file = request.files['design_file']

        if file.filename == '':
            return jsonify({
                'success': False,
                'message': 'No file selected'
            }), 400

        # Upload design file
        result = file_service.upload_file(file, file_type='design', resize_images=False)

        if result['success']:
            logger.info(f"Design file uploaded successfully by user {get_jwt_identity()}")
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        logger.error(f"Error uploading design file: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to upload design file'
        }), 500


@uploads_bp.route('/delete', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_file():
    """Delete uploaded file (admin only)"""
    try:
        data = request.get_json()

        if not data or 'file_url' not in data:
            return jsonify({
                'success': False,
                'message': 'file_url is required'
            }), 400

        file_url = data['file_url']

        # Delete file
        result = file_service.delete_file(file_url)

        if result['success']:
            logger.info(f"File deleted successfully by admin {get_jwt_identity()}: {file_url}")
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        logger.error(f"Error deleting file: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to delete file'
        }), 500


# Serve uploaded files (for local storage only)
@uploads_bp.route('/files/<path:filename>')
def serve_file(filename):
    """Serve uploaded files"""
    try:
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')

        # Security check - prevent directory traversal
        if '..' in filename or filename.startswith('/'):
            return jsonify({
                'success': False,
                'message': 'Invalid file path'
            }), 400

        return send_from_directory(upload_folder, filename)

    except FileNotFoundError:
        return jsonify({
            'success': False,
            'message': 'File not found'
        }), 404
    except Exception as e:
        logger.error(f"Error serving file {filename}: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to serve file'
        }), 500


@uploads_bp.route('/files/info', methods=['POST'])
@jwt_required()
def get_file_info():
    """Get file information"""
    try:
        data = request.get_json()

        if not data or 'file_path' not in data:
            return jsonify({
                'success': False,
                'message': 'file_path is required'
            }), 400

        file_path = data['file_path']

        # Get file info
        file_info = file_service.get_file_info(file_path)

        return jsonify({
            'success': True,
            'file_info': file_info
        }), 200

    except Exception as e:
        logger.error(f"Error getting file info: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to get file information'
        }), 500


@uploads_bp.route('/config', methods=['GET'])
@jwt_required()
def get_upload_config():
    """Get upload configuration"""
    try:
        config = {
            'max_file_size': current_app.config.get('MAX_FILE_SIZE', 16 * 1024 * 1024),
            'allowed_extensions': {
                'images': ['png', 'jpg', 'jpeg', 'gif', 'webp'],
                'documents': ['pdf', 'doc', 'docx', 'txt'],
                'design': ['ai', 'psd', 'eps', 'svg', 'indd']
            },
            'max_file_size_mb': current_app.config.get('MAX_FILE_SIZE', 16 * 1024 * 1024) / (1024 * 1024)
        }

        return jsonify({
            'success': True,
            'config': config
        }), 200

    except Exception as e:
        logger.error(f"Error getting upload config: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to get upload configuration'
        }), 500
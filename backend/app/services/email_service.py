import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import logging
from flask import current_app, render_template_string

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.smtp_server = current_app.config.get('SMTP_SERVER')
        self.smtp_port = current_app.config.get('SMTP_PORT', 587)
        self.smtp_username = current_app.config.get('SMTP_USERNAME')
        self.smtp_password = current_app.config.get('SMTP_PASSWORD')
        self.sender_email = current_app.config.get('SENDER_EMAIL')
        self.sender_name = current_app.config.get('SENDER_NAME', 'Multical')

    def send_email(self, to_email, subject, html_content, text_content=None, attachments=None):
        """Send email with HTML content"""
        try:
            if not all([self.smtp_server, self.smtp_username, self.smtp_password, self.sender_email]):
                logger.warning("Email credentials not fully configured")
                return {'success': False, 'message': 'Email service not configured'}

            # Create message
            message = MIMEMultipart('alternative')
            message['From'] = f"{self.sender_name} <{self.sender_email}>"
            message['To'] = to_email
            message['Subject'] = subject

            # Add text content
            if text_content:
                text_part = MIMEText(text_content, 'plain', 'utf-8')
                message.attach(text_part)

            # Add HTML content
            if html_content:
                html_part = MIMEText(html_content, 'html', 'utf-8')
                message.attach(html_part)

            # Add attachments
            if attachments:
                for attachment in attachments:
                    with open(attachment['path'], 'rb') as file:
                        part = MIMEBase('application', 'octet-stream')
                        part.set_payload(file.read())
                        encoders.encode_base64(part)
                        part.add_header(
                            'Content-Disposition',
                            f'attachment; filename= {attachment["name"]}'
                        )
                        message.attach(part)

            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(message)

            return {'success': True, 'message': 'Email sent successfully'}

        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return {'success': False, 'message': f'Failed to send email: {str(e)}'}

    def send_welcome_email(self, user):
        """Send welcome email to new user"""
        try:
            subject = "Welcome to Multical - Your Account is Ready!"

            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: #2563eb; color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; background: #f9f9f9; }}
                    .footer {{ padding: 20px; text-align: center; color: #666; }}
                    .button {{ background: #2563eb; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 5px; display: inline-block; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to Multical!</h1>
                    </div>
                    <div class="content">
                        <h2>Hello {user.first_name}!</h2>
                        <p>Thank you for joining Multical, your trusted partner for printing and design services.</p>

                        <p>Your account has been successfully created with the following details:</p>
                        <ul>
                            <li><strong>Name:</strong> {user.full_name}</li>
                            <li><strong>Email:</strong> {user.email}</li>
                            <li><strong>Phone:</strong> {user.phone}</li>
                        </ul>

                        <p>You can now:</p>
                        <ul>
                            <li>Browse our products and services</li>
                            <li>Place orders online</li>
                            <li>Book design consultations</li>
                            <li>Track your orders</li>
                            <li>Make payments via M-Pesa</li>
                        </ul>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{current_app.config.get('FRONTEND_URL', '#')}" class="button">
                                Start Shopping
                            </a>
                        </div>

                        <p>If you have any questions, feel free to contact us:</p>
                        <ul>
                            <li>Phone: +254700000000</li>
                            <li>Email: info@multical.co.ke</li>
                            <li>WhatsApp: +254700000000</li>
                        </ul>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 Multical. All rights reserved.</p>
                        <p>Visit us at our store or browse online for the best printing solutions.</p>
                    </div>
                </div>
            </body>
            </html>
            """

            text_content = f"""
            Welcome to Multical!

            Hello {user.first_name}!

            Thank you for joining Multical, your trusted partner for printing and design services.

            Your account details:
            - Name: {user.full_name}
            - Email: {user.email}
            - Phone: {user.phone}

            You can now browse our products, place orders, book consultations, and more!

            Contact us:
            - Phone: +254700000000
            - Email: info@multical.co.ke
            - WhatsApp: +254700000000

            Thank you for choosing Multical!
            """

            return self.send_email(user.email, subject, html_content, text_content)

        except Exception as e:
            logger.error(f"Error sending welcome email: {e}")
            return {'success': False, 'message': str(e)}

    def send_order_confirmation_email(self, order):
        """Send order confirmation email"""
        try:
            subject = f"Order Confirmation - {order.order_number}"

            # Generate order items HTML
            items_html = ""
            for item in order.order_items:
                items_html += f"""
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">{item.item_name}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">{item.quantity}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">KSh {item.unit_price:,.2f}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">KSh {item.total_price:,.2f}</td>
                </tr>
                """

            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: #2563eb; color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; }}
                    .order-details {{ background: #f9f9f9; padding: 15px; margin: 20px 0; }}
                    table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                    th {{ background: #f1f1f1; padding: 10px; text-align: left; }}
                    .total {{ background: #2563eb; color: white; font-weight: bold; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Order Confirmed!</h1>
                        <p>Order #{order.order_number}</p>
                    </div>
                    <div class="content">
                        <h2>Hello {order.customer_name}!</h2>
                        <p>Thank you for your order. We have received your order and it's being processed.</p>

                        <div class="order-details">
                            <h3>Order Details</h3>
                            <p><strong>Order Number:</strong> {order.order_number}</p>
                            <p><strong>Order Date:</strong> {order.created_at.strftime('%d/%m/%Y %H:%M')}</p>
                            <p><strong>Order Type:</strong> {order.order_type.value.title()}</p>
                            <p><strong>Status:</strong> {order.status.value.title()}</p>
                        </div>

                        <h3>Order Items</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th style="text-align: center;">Quantity</th>
                                    <th style="text-align: right;">Unit Price</th>
                                    <th style="text-align: right;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items_html}
                                <tr class="total">
                                    <td colspan="3" style="padding: 15px; text-align: right;">Total Amount:</td>
                                    <td style="padding: 15px; text-align: right;">KSh {order.total_amount:,.2f}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div class="order-details">
                            <h3>Payment Information</h3>
                            <p><strong>Payment Status:</strong> {order.payment_status.title()}</p>
                            {f'<p><strong>Payment Method:</strong> {order.payment_method}</p>' if order.payment_method else ''}
                        </div>

                        {f'''
                        <div class="order-details">
                            <h3>Delivery Information</h3>
                            <p><strong>Delivery Address:</strong> {order.delivery_address}</p>
                            {f'<p><strong>City:</strong> {order.delivery_city}</p>' if order.delivery_city else ''}
                            {f'<p><strong>Notes:</strong> {order.delivery_notes}</p>' if order.delivery_notes else ''}
                        </div>
                        ''' if order.delivery_address else ''}

                        <p>We'll keep you updated on your order progress via email and WhatsApp.</p>

                        <p>If you have any questions, contact us:</p>
                        <ul>
                            <li>Phone: +254700000000</li>
                            <li>Email: info@multical.co.ke</li>
                            <li>WhatsApp: +254700000000</li>
                        </ul>
                    </div>
                </div>
            </body>
            </html>
            """

            return self.send_email(order.customer_email, subject, html_content)

        except Exception as e:
            logger.error(f"Error sending order confirmation email: {e}")
            return {'success': False, 'message': str(e)}

    def send_password_reset_email(self, email, reset_token):
        """Send password reset email"""
        try:
            subject = "Reset Your Multical Password"

            reset_url = f"{current_app.config.get('FRONTEND_URL', '')}/reset-password?token={reset_token}"

            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: #2563eb; color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; }}
                    .button {{ background: #2563eb; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 5px; display: inline-block; }}
                    .warning {{ background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <p>Hello!</p>
                        <p>We received a request to reset your Multical account password.</p>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{reset_url}" class="button">Reset Password</a>
                        </div>

                        <p>Or copy and paste this link in your browser:</p>
                        <p style="word-break: break-all; background: #f3f4f6; padding: 10px;">{reset_url}</p>

                        <div class="warning">
                            <strong>Important:</strong> This link will expire in 1 hour for security reasons.
                        </div>

                        <p>If you didn't request a password reset, please ignore this email or contact us if you have concerns.</p>

                        <p>For support:</p>
                        <ul>
                            <li>Phone: +254700000000</li>
                            <li>Email: info@multical.co.ke</li>
                        </ul>
                    </div>
                </div>
            </body>
            </html>
            """

            text_content = f"""
            Password Reset Request

            Hello!

            We received a request to reset your Multical account password.

            Reset your password by visiting this link:
            {reset_url}

            This link will expire in 1 hour for security reasons.

            If you didn't request a password reset, please ignore this email.

            For support: +254700000000 or info@multical.co.ke
            """

            return self.send_email(email, subject, html_content, text_content)

        except Exception as e:
            logger.error(f"Error sending password reset email: {e}")
            return {'success': False, 'message': str(e)}
import requests
import logging
from flask import current_app

logger = logging.getLogger(__name__)


class WhatsAppService:
    def __init__(self):
        self.token = current_app.config.get('WHATSAPP_TOKEN')
        self.phone_number_id = current_app.config.get('WHATSAPP_PHONE_NUMBER_ID')
        self.base_url = "https://graph.facebook.com/v17.0"

    def send_message(self, to_phone, message_type, **kwargs):
        """Send WhatsApp message"""
        try:
            if not self.token or not self.phone_number_id:
                logger.warning("WhatsApp credentials not configured")
                return {'success': False, 'message': 'WhatsApp not configured'}

            # Format phone number
            if to_phone.startswith('+'):
                to_phone = to_phone[1:]
            elif to_phone.startswith('0'):
                to_phone = f"254{to_phone[1:]}"

            url = f"{self.base_url}/{self.phone_number_id}/messages"

            headers = {
                'Authorization': f'Bearer {self.token}',
                'Content-Type': 'application/json'
            }

            payload = {
                'messaging_product': 'whatsapp',
                'to': to_phone,
                'type': message_type
            }

            # Add message content based on type
            if message_type == 'text':
                payload['text'] = {'body': kwargs.get('text', '')}
            elif message_type == 'template':
                payload['template'] = kwargs.get('template', {})

            response = requests.post(url, json=payload, headers=headers)

            if response.status_code == 200:
                return {'success': True, 'data': response.json()}
            else:
                logger.error(f"WhatsApp API error: {response.text}")
                return {'success': False, 'message': response.text}

        except Exception as e:
            logger.error(f"Error sending WhatsApp message: {e}")
            return {'success': False, 'message': str(e)}

    def send_text_message(self, to_phone, text):
        """Send simple text message"""
        return self.send_message(to_phone, 'text', text=text)

    def send_order_confirmation(self, order):
        """Send order confirmation message"""
        try:
            message = f"""
🎉 *Order Confirmation - Multical*

Hello {order.customer_name}!

Your order has been confirmed:
📋 Order Number: {order.order_number}
💰 Total Amount: KSh {order.total_amount:,.2f}
📅 Date: {order.created_at.strftime('%d/%m/%Y %H:%M')}

Order Items:
"""

            for item in order.order_items:
                message += f"• {item.item_name} (x{item.quantity}) - KSh {item.total_price:,.2f}\n"

            message += f"""
📍 Delivery: {order.delivery_address or 'Pickup from store'}

We'll keep you updated on your order progress.

Thank you for choosing Multical! 🙏

For support: Call/WhatsApp +254700000000
"""

            return self.send_text_message(order.customer_phone, message.strip())

        except Exception as e:
            logger.error(f"Error sending order confirmation: {e}")
            return {'success': False, 'message': str(e)}

    def send_payment_confirmation(self, order, payment):
        """Send payment confirmation message"""
        try:
            message = f"""
✅ *Payment Confirmed - Multical*

Hello {order.customer_name}!

Your payment has been successfully received:
💳 Payment Amount: KSh {payment.amount:,.2f}
🧾 Receipt: {payment.mpesa_receipt_number or 'N/A'}
📋 Order: {order.order_number}
⏰ Time: {payment.completed_at.strftime('%d/%m/%Y %H:%M') if payment.completed_at else 'Just now'}

Your order is now confirmed and will be processed shortly.

Thank you for your payment! 🎉

For support: Call/WhatsApp +254700000000
"""

            return self.send_text_message(order.customer_phone, message.strip())

        except Exception as e:
            logger.error(f"Error sending payment confirmation: {e}")
            return {'success': False, 'message': str(e)}

    def send_order_status_update(self, order, new_status):
        """Send order status update"""
        try:
            status_messages = {
                'processing': f"🔄 Your order {order.order_number} is now being processed.",
                'ready': f"✅ Great news! Your order {order.order_number} is ready for pickup/delivery.",
                'completed': f"🎉 Your order {order.order_number} has been completed. Thank you!",
                'cancelled': f"❌ Your order {order.order_number} has been cancelled. Contact us for details."
            }

            message = f"""
*Order Update - Multical*

Hello {order.customer_name}!

{status_messages.get(new_status, f"Your order {order.order_number} status has been updated to: {new_status}")}

Order Details:
📋 Order Number: {order.order_number}
💰 Amount: KSh {order.total_amount:,.2f}

For support: Call/WhatsApp +254700000000
"""

            return self.send_text_message(order.customer_phone, message.strip())

        except Exception as e:
            logger.error(f"Error sending status update: {e}")
            return {'success': False, 'message': str(e)}

    def send_consultation_confirmation(self, consultation):
        """Send design consultation confirmation"""
        try:
            message = f"""
📅 *Design Consultation Booked - Multical*

Hello {consultation.customer.full_name}!

Your design consultation has been scheduled:
🎨 Project: {consultation.project_title}
📅 Date: {consultation.scheduled_date.strftime('%d/%m/%Y %H:%M') if consultation.scheduled_date else 'To be confirmed'}
⏱️ Duration: {consultation.duration_minutes} minutes
💰 Estimated Cost: KSh {consultation.estimated_cost:,.2f} (if applicable)

Our design team will contact you shortly to finalize the details.

Prepare any reference materials or ideas you'd like to discuss!

For support: Call/WhatsApp +254700000000
"""

            return self.send_text_message(consultation.customer.phone, message.strip())

        except Exception as e:
            logger.error(f"Error sending consultation confirmation: {e}")
            return {'success': False, 'message': str(e)}

    def send_paybill_instructions(self, order):
        """Send M-Pesa paybill payment instructions"""
        try:
            message = f"""
💳 *Payment Instructions - Multical*

Hello {order.customer_name}!

To complete your order payment:

📱 *M-Pesa Paybill Steps:*
1. Go to M-Pesa menu
2. Select "Lipa na M-Pesa"
3. Select "Pay Bill"
4. Enter Business No: *174379*
5. Enter Account No: *{order.order_number}*
6. Enter Amount: *{order.total_amount:,.0f}*
7. Enter your M-Pesa PIN
8. Confirm payment

💰 Amount: KSh {order.total_amount:,.2f}
📋 Order: {order.order_number}

After payment, you'll receive confirmation within minutes.

For support: Call/WhatsApp +254700000000
"""

            return self.send_text_message(order.customer_phone, message.strip())

        except Exception as e:
            logger.error(f"Error sending paybill instructions: {e}")
            return {'success': False, 'message': str(e)}
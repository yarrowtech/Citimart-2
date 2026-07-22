'''
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv
import os

load_dotenv()

EMAIL_HOST = os.getenv('EMAIL_HOST')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))  # safe fallback
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')

# ✅ Debug prints to verify .env is working
print("SMTP HOST:", EMAIL_HOST)
print("SMTP USER:", EMAIL_HOST_USER)
print("SMTP PASS Length:", len(EMAIL_HOST_PASSWORD) if EMAIL_HOST_PASSWORD else "None")

def send_email(to_email, subject, body):
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = EMAIL_HOST_USER
    msg['To'] = to_email

    try:
        server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
        server.starttls()
        server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
        server.sendmail(EMAIL_HOST_USER, [to_email], msg.as_string())
        server.quit()
        print("✅ Email sent successfully.")
        return True
    except Exception as e:
        print("❌ Email send error:", e)
        return False

#----Vendor approval email ------
def send_vendor_approval_email(vendor_email, vendor_name, reset_token):
    try:
        link = f"{os.getenv('FRONTEND_URL')}/set-password/{reset_token}"
        subject = "Your Vendor Account has been Approved!"
        body = f"""
Hi {vendor_name},

Congratulations! Your vendor application has been approved by Citimart Admin.

To activate your account, please click the link below to set your password:

{link}

This link is valid for one-time use only.

If you did not request this, please ignore this email.

Thank you,
Citimart Team
"""
        return send_email(vendor_email, subject, body)
    except Exception as e:
        print("❌ Vendor approval email error:", e)
        return False
'''

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv
import os
from datetime import datetime

load_dotenv()

EMAIL_HOST = os.getenv('EMAIL_HOST')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
FRONTEND_URL = os.getenv('FRONTEND_URL')

# ----------------------------
# Generic send_email
# ----------------------------
def send_email(to_email, subject, body, html=False):
    try:
        msg = MIMEMultipart("alternative")
        msg['Subject'] = subject
        msg['From'] = EMAIL_HOST_USER
        msg['To'] = to_email

        if html:
            part = MIMEText(body, "html")
        else:
            part = MIMEText(body, "plain")
        
        msg.attach(part)

        server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
        server.starttls()
        server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
        server.sendmail(EMAIL_HOST_USER, [to_email], msg.as_string())
        server.quit()
        print("✅ Email sent successfully.")
        return True
    except Exception as e:
        print("❌ Email send error:", e)
        return False

# ----------------------------
# Vendor Approval Email (plain text)
# ----------------------------
def send_vendor_approval_email(vendor_email, vendor_name, reset_token):
    try:
        link = f"{FRONTEND_URL}/set-password/{reset_token}"
        subject = "Your Vendor Account has been Approved!"
        body = f"""Hi {vendor_name},

Congratulations! Your vendor application has been approved by Citimart Admin.

To activate your account, please click the link below to set your password:

{link}

This link is valid for one-time use only.

If you did not request this, please ignore this email.

Thank you,
Citimart Team
"""
        return send_email(vendor_email, subject, body)  # plain text
    except Exception as e:
        print("❌ Vendor approval email error:", e)
        return False

# ----------------------------
# Subuser Invitation Email (HTML)
# ----------------------------
from urllib.parse import quote
def send_subuser_invitation_email(subuser_email, parent_type, role, permissions, setup_token):
    try:
        

        setup_link = f"{FRONTEND_URL}/subuser/setup?token={quote(setup_token)}"

        subject = "Complete Your Subuser Setup"

        # HTML permissions list
        permissions_list = "".join(
            f"<li>{perm.capitalize()}</li>" for perm, allowed in permissions.items() if allowed
        )

        html_body = f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Citimart</title>
  <style>
    body {{ margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f4f4f4; }}
    .container {{ max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden; }}
    .header {{ background-color:#007bff; padding:20px; text-align:center; color:#ffffff; }}
    .header h1 {{ margin:0; font-size:28px; }}
    .content {{ padding:20px; color:#333333; font-size:16px; line-height:1.5; }}
    .btn {{ background-color:#28a745; color:#ffffff; padding:12px 24px; text-decoration:none; border-radius:4px; font-weight:bold; display:inline-block; }}
    .footer {{ background:#f4f4f4; text-align:center; padding:10px; font-size:12px; color:#888888; }}
    hr {{ border:none; border-top:1px solid #eeeeee; margin:20px 0; }}
    ul {{ padding-left:20px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Citimart</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>You’ve been invited as a <strong>Subuser</strong> under <strong>{parent_type}</strong>.</p>
      <p><strong>Role:</strong> {role}</p>
      <p><strong>Permissions:</strong></p>
      <ul>{permissions_list}</ul>
      <p style="text-align:center; margin:30px 0;">
        <a href="{setup_link}" class="btn">Setup My Account</a>
      </p>
      <p>Please complete your account setup within <strong>24 hours</strong>.</p>
      <hr>
      <p style="font-size:12px; color:#888888;">If you did not expect this invitation, please ignore this email.</p>
    </div>
    <div class="footer">
      &copy; {datetime.utcnow().year} Citimart. All rights reserved.
    </div>
  </div>
</body>
</html>
"""
        return send_email(subuser_email, subject, html_body, html=True)
    except Exception as e:
        print("❌ Subuser invitation email error:", e)
        return False

import smtplib
import logging
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

def send_failure_email(to_email: str, repo_url: str, error_message: str):
    """
    Sends a failure notification email to the repository owner.
    Requires SMTP_USER and SMTP_PASSWORD in environment.
    """
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))

    if not smtp_user or not smtp_password:
        logger.warning(f"SMTP credentials missing. Could not send failure email to {to_email}")
        return

    msg = MIMEMultipart()
    msg['From'] = smtp_user
    msg['To'] = to_email
    msg['Subject'] = "Fixora Agent Failure Notification"

    body = f"""
    The Fixora Autonomous CI/CD Agent encountered a critical failure or an invalid API key.

    Repository: {repo_url}
    Error: {error_message}

    Please verify your API key and repository status.

    -- Fixora Autonomous Engine
    """
    msg.attach(MIMEText(body, 'plain'))

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        logger.info(f"Failure email sent to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email: {e}")

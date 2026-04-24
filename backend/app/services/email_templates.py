def get_base_template(content_html: str, preview_text: str = "") -> str:
    """Provides a premium responsive base layout for emails."""
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Notification</title>
    <style>
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #0c0e06;
            color: #ffffff;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }}
        .container {{
            max-width: 600px;
            margin: 40px auto;
            background-color: #1a1e0a;
            border: 1px solid #c1d94922;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }}
        .header {{
            background: linear-gradient(135deg, #c1d949 0%, #a1b82a 100%);
            padding: 40px 20px;
            text-align: center;
        }}
        .header h1 {{
            margin: 0;
            color: #1a1e0a;
            font-size: 28px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 2px;
        }}
        .content {{
            padding: 40px;
            line-height: 1.6;
            color: #d1d5db;
        }}
        .content h2 {{
            color: #ffffff;
            font-size: 24px;
            margin-top: 0;
        }}
        .footer {{
            padding: 20px 40px;
            background-color: #141808;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #ffffff05;
        }}
        .btn {{
            display: inline-block;
            padding: 14px 28px;
            background-color: #c1d949;
            color: #1a1e0a !important;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 700;
            margin-top: 20px;
            transition: transform 0.2s;
        }}
        .meta-box {{
            background-color: #ffffff05;
            border-radius: 16px;
            padding: 20px;
            margin: 20px 0;
            border: 1px solid #ffffff05;
        }}
        .meta-item {{
            margin-bottom: 8px;
            font-size: 14px;
        }}
        .meta-label {{
            color: #c1d949;
            font-weight: 600;
            margin-right: 8px;
        }}
    </style>
</head>
<body>
    <div style="display:none; font-size:1px; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">
        {preview_text}
    </div>
    <div class="container">
        <div class="header">
            <h1>EVENTIC</h1>
        </div>
        <div class="content">
            {content_html}
        </div>
        <div class="footer">
            &copy; 2026 Eventic Orchestrator. All rights reserved.<br>
            Designed for industry leaders and tech enthusiasts.
        </div>
    </div>
</body>
</html>
"""

def get_registration_template(event_title: str, attendee_name: str, status: str, venue: str, date: str) -> str:
    status_colors = {
        "PENDING": "#f59e0b",
        "APPROVED": "#10b981",
        "REGISTERED": "#c1d949",
        "REJECTED": "#ef4444",
        "REVOKED": "#6b7280"
    }
    color = status_colors.get(status.upper(), "#c1d949")
    
    content = f"""
    <h2>Registration Update</h2>
    <p>Hi <strong>{attendee_name}</strong>,</p>
    <p>Your registration status for <strong>{event_title}</strong> has been updated to:</p>
    
    <div style="display: inline-block; padding: 6px 12px; background-color: {color}22; color: {color}; border-radius: 8px; font-weight: 700; font-size: 14px; margin-bottom: 20px;">
        {status.upper()}
    </div>
    
    <div class="meta-box">
        <div class="meta-item"><span class="meta-label">Event:</span> {event_title}</div>
        <div class="meta-item"><span class="meta-label">Date:</span> {date}</div>
        <div class="meta-item"><span class="meta-label">Location:</span> {venue}</div>
    </div>
    
    <p>Please keep this email for your records. If you have any questions, contact the event organizer.</p>
    """
    return get_base_template(content, f"Your registration for {event_title} is {status.lower()}.")

def get_event_update_template(event_title: str, message: str, is_cancelled: bool = False) -> str:
    title = "Event Cancelled" if is_cancelled else "Event Updated"
    color = "#ef4444" if is_cancelled else "#c1d949"
    
    content = f"""
    <h2 style="color: {color}">{title}</h2>
    <p>Important update regarding <strong>{event_title}</strong>:</p>
    
    <div class="meta-box">
        {message}
    </div>
    
    <p>We apologize for any inconvenience this may cause.</p>
    """
    return get_base_template(content, f"Update for {event_title}: {title}")

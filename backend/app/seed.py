"""
Seed script for RAC Boardroom Simulator demo environment.
Only executes when DEMO_MODE=true and DEMO_PASSWORD is set.
Run with: python -m app.seed
"""

import sys
from sqlmodel import Session, select

from app.config import settings
from app.db import engine, create_db_and_tables
from app.models.portal import User, UserRole
from app.services.auth import hash_password


def seed_demo_accounts():
    if not settings.DEMO_MODE:
        print("DEMO_MODE is not enabled. Skipping seed.")
        return

    if not settings.DEMO_PASSWORD:
        print("DEMO_PASSWORD is not set. Cannot seed demo accounts.")
        return

    create_db_and_tables()

    password_hash = hash_password(settings.DEMO_PASSWORD)

    demo_users = [
        {
            "email": "admin@rac.demo",
            "full_name": "Dr. A. Rao",
            "role": UserRole.admin,
            "discipline": None,
            "specialisation": None,
        },
        {
            "email": "mehta@rac.demo",
            "full_name": "Dr. Mehta",
            "role": UserRole.board,
            "discipline": "Electronics & Communication",
            "specialisation": "Radar systems",
        },
        {
            "email": "iyer@rac.demo",
            "full_name": "Dr. Iyer",
            "role": UserRole.board,
            "discipline": "Electronics & Communication",
            "specialisation": "Signal processing",
        },
        {
            "email": "khan@rac.demo",
            "full_name": "Dr. Khan",
            "role": UserRole.board,
            "discipline": "Chemistry",
            "specialisation": "Polymer chemistry",
        },
    ]

    with Session(engine) as db:
        for udata in demo_users:
            email_clean = udata["email"].lower().strip()
            existing = db.exec(select(User).where(User.email == email_clean)).first()
            if not existing:
                user = User(
                    email=email_clean,
                    password_hash=password_hash,
                    full_name=udata["full_name"],
                    role=udata["role"],
                    discipline=udata["discipline"],
                    specialisation=udata["specialisation"],
                    is_active=True,
                )
                db.add(user)
                print(f"Created demo account: {email_clean} ({udata['role'].value})")
            else:
                existing.password_hash = password_hash
                existing.full_name = udata["full_name"]
                existing.role = udata["role"]
                existing.discipline = udata["discipline"]
                existing.specialisation = udata["specialisation"]
                db.add(existing)
                print(f"Updated demo account: {email_clean}")

        db.commit()
        print("Demo seeding completed successfully.")


if __name__ == "__main__":
    seed_demo_accounts()

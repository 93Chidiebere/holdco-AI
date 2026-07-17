import os
# Force the production database URL
os.environ["DATABASE_URL"] = "postgresql://postgres:3&CH#Z9xW8^!d$B@db.airwhqcffqnooanoxxep.supabase.co:5432/postgres"

from database import SessionLocal
import models
import auth

def create_superadmin():
    db = SessionLocal()
    print(f"Connecting to DB: {os.environ.get('DATABASE_URL')}")
    try:
        email = "vchidiebere.vc@gmail.com"
        password = "93Chidiebere!"
        
        # Check if already exists
        existing_user = db.query(models.User).filter(models.User.email == email).first()
        if existing_user:
            print(f"Superadmin {email} already exists in remote DB! Updating password and role to ensure superadmin access.")
            existing_user.hashed_password = auth.get_password_hash(password)
            existing_user.role = "superadmin"
            existing_user.holding_company_id = None
        else:
            print(f"Creating superadmin {email} in remote DB...")
            new_user = models.User(
                email=email,
                hashed_password=auth.get_password_hash(password),
                name="Chidiebere (Platform Owner)",
                role="superadmin",
                holding_company_id=None
            )
            db.add(new_user)
            
        db.commit()
        print("Superadmin account successfully created/updated in the LIVE database!")
    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_superadmin()

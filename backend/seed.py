from database import SessionLocal
from models import BusRoute

def seed_routes():
    db = SessionLocal()
    
    # Check if routes already exist to avoid duplicate seeding
    existing_routes = db.query(BusRoute).first()
    if existing_routes:
        print("Database is already seeded with bus routes!")
        db.close()
        return

    sample_routes = [
        BusRoute(route_no="347", source_stop="Swargate", destination_stop="Hinjewadi Phase 3", duration_mins=55, fare=30.0),
        BusRoute(route_no="24", source_stop="Katraj", destination_stop="Shivajinagar", duration_mins=40, fare=20.0),
        BusRoute(route_no="52", source_stop="Hadapsar", destination_stop="Wakad", duration_mins=65, fare=35.0),
        BusRoute(route_no="115", source_stop="Pune Station", destination_stop="Kothrud Depot", duration_mins=30, fare=15.0),
        BusRoute(route_no="222", source_stop="Swargate", destination_stop="Akurdi Station", duration_mins=50, fare=25.0)
    ]

    db.add_all(sample_routes)
    db.commit()
    db.close()
    print("Successfully seeded Pune PMPML bus routes!")

if __name__ == "__main__":
    seed_routes()
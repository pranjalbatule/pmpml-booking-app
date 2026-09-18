import pandas as pd
from database import SessionLocal
from models import BusRoute

def import_pmpml_routes(csv_file_path):
    db = SessionLocal()
    try:
        # Read the CSV file
        df = pd.read_csv(csv_file_path)
        print(f"Successfully loaded CSV! Total rows: {len(df)}")
        
        imported_count = 0
        for _, row in df.iterrows():
            route_no = str(row.get('Route ID', '000')).strip()
            description = str(row.get('Route Description', '')).strip()
            distance_km = float(row.get('Kilometer', 10.0)) if pd.notna(row.get('Kilometer')) else 10.0
            
            # Skip if description doesn't contain ' To '
            if ' To ' not in description:
                continue
                
            # Split description into source and destination
            parts = description.split(' To ')
            source_stop = parts[0].strip()
            destination_stop = parts[1].strip()
            
            # Estimate fare and duration based on distance (₹10 base + ₹5 per km, approx 2 mins per km)
            fare = round(10 + (distance_km * 3), 2)
            duration_mins = int(distance_km * 2.5)
            
            # Check if route already exists
            existing = db.query(BusRoute).filter(
                BusRoute.route_no == route_no, 
                BusRoute.source_stop == source_stop,
                BusRoute.destination_stop == destination_stop
            ).first()
            
            if not existing:
                new_route = BusRoute(
                    route_no=route_no,
                    source_stop=source_stop,
                    destination_stop=destination_stop,
                    fare=fare,
                    duration_mins=duration_mins
                )
                db.add(new_route)
                imported_count += 1
        
        db.commit()
        print(f"Successfully imported {imported_count} PMPML routes into MySQL!")
    except Exception as e:
        db.rollback()
        print(f"Error during import: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import_pmpml_routes("pmpml_routes.csv")
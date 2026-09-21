# Restaurant Manager API Documentation

Base URL: /api/

All Manager endpoints require JWT authentication.

Header:
Authorization: Bearer <access_token>

## Access Rules

All Manager APIs require:
- Authenticated user
- Role: RESTAURANT_MANAGER
- Active restaurant assignment
- Requested resource must belong to the Manager's assigned restaurant

Common responses:
- 400 = Invalid request
- 401 = Missing/invalid JWT
- 403 = Wrong role or no active assignment
- 404 = Resource not found or belongs to another restaurant


# 1. Dashboard

GET /api/manager/dashboard/

Returns Manager dashboard statistics.

Example response:

{
  "restaurants": 1,
  "reservations": {
    "total": 20,
    "today": 4,
    "upcoming": 10,
    "pending": 3
  },
  "branches": {
    "total": 2,
    "active": 2
  },
  "tables": {
    "total": 15,
    "active": 13
  },
  "menu_items": {
    "total": 30,
    "available": 25
  }
}


# 2. Restaurant Profile

GET /api/manager/restaurant/

Returns restaurants assigned to the logged-in Manager.

PATCH /api/manager/restaurant/

Editable fields:
- name
- cuisine
- description
- image_url

Read-only:
- id
- rating
- is_active

Example request:

{
  "name": "Updated Restaurant",
  "description": "Updated description",
  "image_url": "https://example.com/image.jpg"
}

If the Manager has multiple assigned restaurants, include restaurant_id.


# 3. Branch Management

GET /api/manager/branches/

Returns branches belonging to the Manager's restaurants.

POST /api/manager/branches/

Example request:

{
  "name": "Banani Branch",
  "address": "Banani, Dhaka",
  "phone": "01700000001",
  "opening_time": "09:00",
  "closing_time": "23:00",
  "is_active": true
}

If the Manager has multiple restaurants, restaurant_id can be supplied.

GET /api/manager/branches/<id>/

Returns one owned branch.

PATCH /api/manager/branches/<id>/

Updates one owned branch.

DELETE /api/manager/branches/<id>/

Soft-deactivates the branch by setting is_active=false.


# 4. Menu Management

GET /api/manager/menu/

Returns menu items belonging to the Manager's restaurants.

POST /api/manager/menu/

Example request:

{
  "name": "Chicken Burger",
  "category": "Burger",
  "description": "Chicken burger with cheese",
  "price": "350.00",
  "image_url": "https://example.com/burger.jpg",
  "is_available": true
}

Validation:
- Price cannot be negative
- image_url must be valid when supplied
- rating is read-only
- Restaurant ownership is enforced

GET /api/manager/menu/<id>/

Returns one owned menu item.

PATCH /api/manager/menu/<id>/

Updates one owned menu item.

Example:

{
  "name": "Spicy Chicken Burger",
  "price": "399.00",
  "is_available": true
}

DELETE /api/manager/menu/<id>/

Soft-deactivates the menu item by setting is_available=false.


# 5. Table Management

GET /api/manager/tables/

Returns tables belonging to the Manager's restaurant branches.

POST /api/manager/tables/

branch_id is required.

Example request:

{
  "branch_id": 1,
  "table_number": "T10",
  "capacity": 6,
  "seating_type": "WINDOW",
  "is_active": true
}

Valid seating types:
- INDOOR
- OUTDOOR
- WINDOW

Validation:
- Capacity must be greater than 0
- Branch must belong to the Manager
- Table number must be unique inside a branch
- Invalid seating type returns 400

GET /api/manager/tables/<id>/

Returns one owned table.

PATCH /api/manager/tables/<id>/

Updates one owned table.

Example:

{
  "table_number": "T11",
  "capacity": 8,
  "seating_type": "WINDOW"
}

A table cannot be moved to another branch through PATCH.

DELETE /api/manager/tables/<id>/

Soft-deactivates the table by setting is_active=false.


# 6. Reservation Management

GET /api/manager/reservations/

Returns reservations belonging only to the Manager's assigned restaurants.

Available filters:

Status:
GET /api/manager/reservations/?status=CONFIRMED

Statuses:
- PENDING
- CONFIRMED
- CANCELLED
- COMPLETED

Date:
GET /api/manager/reservations/?date=2026-09-21

Date format:
YYYY-MM-DD

Branch:
GET /api/manager/reservations/?branch=1

Table:
GET /api/manager/reservations/?table=3

Customer search:
GET /api/manager/reservations/?search=Rakibul

Search checks customer name and customer phone.

Today:
GET /api/manager/reservations/?scope=today

Upcoming:
GET /api/manager/reservations/?scope=upcoming

History:
GET /api/manager/reservations/?scope=history

Filters can be combined.

GET /api/manager/reservations/<id>/

Returns one owned reservation.

Another restaurant's reservation returns 404.


# Reservation Status Update

PATCH /api/manager/reservations/<id>/status/

Updates the status of a reservation belonging to the Manager's restaurant.

Example request:

{
  "status": "CONFIRMED"
}

Allowed transitions:

PENDING -> CONFIRMED
PENDING -> CANCELLED

CONFIRMED -> COMPLETED
CONFIRMED -> CANCELLED

CANCELLED -> no further status changes
COMPLETED -> no further status changes

Updating a reservation to its current status is allowed and returns success
as an idempotent no-op.

Rejected examples:

PENDING -> COMPLETED
CONFIRMED -> PENDING
CANCELLED -> PENDING
CANCELLED -> CONFIRMED
CANCELLED -> COMPLETED
COMPLETED -> PENDING
COMPLETED -> CONFIRMED
COMPLETED -> CANCELLED

Missing status returns 400.

Invalid status returns 400.

Another restaurant's reservation returns 404.

Anonymous users receive 401.

Customers and other unauthorized roles receive 403.

Managers without an active restaurant assignment receive 403.


# API Summary

GET    /api/manager/dashboard/
GET    /api/manager/restaurant/
PATCH  /api/manager/restaurant/

GET    /api/manager/branches/
POST   /api/manager/branches/
GET    /api/manager/branches/<id>/
PATCH  /api/manager/branches/<id>/
DELETE /api/manager/branches/<id>/

GET    /api/manager/menu/
POST   /api/manager/menu/
GET    /api/manager/menu/<id>/
PATCH  /api/manager/menu/<id>/
DELETE /api/manager/menu/<id>/

GET    /api/manager/tables/
POST   /api/manager/tables/
GET    /api/manager/tables/<id>/
PATCH  /api/manager/tables/<id>/
DELETE /api/manager/tables/<id>/

GET    /api/manager/reservations/
GET    /api/manager/reservations/<id>/
PATCH  /api/manager/reservations/<id>/status/


# Current Test Status

69 Restaurant Manager backend tests passing.

Covered:
- Restaurant Profile
- Branch Management
- Menu Management
- Table Management
- Reservation filtering and ownership
- Manager Dashboard
- JWT authentication
- Role permissions
- Restaurant ownership isolation
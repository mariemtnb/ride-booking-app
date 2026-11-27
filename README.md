# Ride Booking App

Web application to book rides, with a passenger space and a driver space.

## Features

**Passenger:** address selection on Google Maps, route display, fare calculation, ride history, notifications.

**Driver:** online / offline status, GPS tracking, incoming ride requests, ride history, receipts with commission.

## Stack

React, Tailwind CSS, Laravel, Sanctum, Google Maps API

## Structure

| Folder | Content |
|---|---|
| `backend/` | Laravel REST API |
| `frontend/` | React client |
| `docs/diagrams/` | UML diagrams (PlantUML) |

## Run locally

Backend:

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

Frontend:

```bash
cd frontend
npm install
cp .env.example .env   # add your Google Maps API key
npm start
```

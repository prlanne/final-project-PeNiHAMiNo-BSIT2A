# BentaBoard
Phase 3: Frontend Development

## 📌 Project Overview
*BentaBoard* is a simple, web-based tool that helps small business owners to manage their day-to-day sales and expenses. It’s made for micro-entrepreneurs like sari-sari store owners, market vendors, and online sellers. Many of them still track their money using handwritten notes or just relying on memory. This often leads to mistakes and makes it hard to know if their business is doing well. BentaBoard fixes that problem by offering an easy-to-use system that automatically tracks finances and computes profits no need for complicated accounting software.  

The system follows a planned architecture based on the group’s *ERD, Use Case Diagram, and System Design*, ensuring that each feature and page corresponds directly to defined user roles and data flows.      

In this phase, the focus is on building the *user interface layer (frontend)* that will later connect to backend services. The design emphasizes usability, responsiveness, and consistency across all pages using Bootstrap 5.


## 📍 What Was Implemented (Phase 3)
During this phase, the PeNiHaMino developed the complete frontend structure of BentaBoard based on the approved system plan:

* Created multiple HTML pages corresponding to system use cases such as *login, registration, dashboard, and profile management*
* Designed responsive layouts using *Bootstrap 5 components* (navbar, grid system, cards, and forms)
* Built structured forms with input fields aligned with the *ERD attributes* (e.g., user information fields)
* Established consistent navigation flow across all pages based on the *system architecture*
* Ensured all pages are modular, readable, and ready for API connection in the next phase

## 🔗 Alignment with Use Case and ERD
The frontend of *BentaBoard* was developed based on the system’s *Use Case Diagram* and *ERD*, ensuring that all pages, forms, and navigation flows reflect the intended system behavior and core data structure.

*Alignment with Use Case Diagram*

The system defines two main user roles: *Seller* and *Admin*, and the frontend pages were designed to support their key actions:

* *Login Page (login.html)*
    * Matches the Log in / Log out use case for both Seller and Admin
* *Dashboard (dashboard.html)*
    * Serves as the central interface where users access:
         * Viewing reports (daily, monthly, yearly)
         * Managing system features based on role
* *Product / Sales / Expense Features (UI sections or pages)*
    * Reflect Seller actions such as:
         * Manage Product (Add/Delete)
         * Record Daily Sales
         * Record Expenses
         * Record Inventory Purchases
* *Admin-related UI*
    * Supports:
         * Manage User Account
         * View All Reports
         * Configure System Settings

The navigation flow (Login → Dashboard → Functional Pages) follows the structure shown in the use case diagram.



## 🧩 Alignment with ERD (Key Entities Only)
Instead of mapping all fields, the frontend focuses on the *core entities* from the ERD:
* *Users*
    * Used in login, registration, and profile pages
    * Ensures authentication and role-based access (Seller/Admin)
* *Products*
    * Reflected in product management UI (add/view products)
    * Includes essential inputs like product name, price, and stock
* *Sales*
    * Represented in sales recording and dashboard summaries
    * Connects products and user activity
* *Purchases*
    * Used in inventory-related forms (recording stock entries)
* *Expenses* 
    * Implemented through expense recording forms
These entities are connected in the frontend through forms and UI components that mirror their relationships in the ERD (e.g., sales linked to products and users).

*Summary*
* Frontend pages directly support the *main use cases* for Seller and Admin
* Only *key ERD entities* were translated into UI components to keep the design focused and functional
* Forms and navigation ensure consistency with both *system behavior (Use Case)* and *data structure (ERD)*
* The system is properly prepared for backend integration in the next phase
  
## 📂 Detailed Folder Structure
```text
/
├── frontend/
│   ├── css/
│   │   └── style.css          
│   ├── img/
│   │   └── bentaboard.png             
│   ├── js/
│   │   └── script.js             
│   ├── analytics.html               
│   ├── dashboard.html             
│   ├── expenses.html       
│   ├── index.html             
│   ├── inventory.html        
│   ├── login.html
│   ├── purchases.html       
│   ├── register.html              
│   ├── reports.html           
│   ├── saleslogs.html           
│   ├── settings.html    
│   ├── weather.html                
│   └── README.md

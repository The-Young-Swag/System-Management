
# 🛡️ System-Management (RBAC Auth System)

![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![React](https://img.shields.io/badge/React-18.x-61DAFB)
![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1)

An enterprise-grade **Role-Based Access Control (RBAC)** authentication system designed for scalability. This foundation dynamically manages users, roles, and menu permissions without requiring frontend redeploys.

> **Why this exists:** Built as the foundational micro-service for multi-tenant SaaS applications to handle complex authorization flows with soft-delete auditing.

---

## 🚀 Key Features

- **🔐 JWT Authentication** – Secure HttpOnly cookies with access/refresh token rotation.
- **🧩 Dynamic RBAC** – Menus are rendered based on the `PrivilegeManagement` matrix in real-time.
- **🔄 Auto-Assign Logic** – Creating a new Menu/Role automatically propagates permissions across the entire system.
- **🗑️ Soft Deletes** – Core entity tables (`MenuManagement`, `RoleManagement`, `UserManagement`) support `is_deleted` flags for full audit trails; `PrivilegeManagement` uses `is_active` toggles since it's a junction table.
- **⚡ Optimized Queries** – Composite indexes and foreign key constraints ensure data integrity.
- **📊 MySQL Transactions** – Ensures atomicity during permission propagation.

---

## 🏗️ Architecture & Database Schema

The system relies on a normalized relational database with 4 core tables:

| Table | Purpose |
| :--- | :--- |
| `MenuManagement` | Stores UI routes, icons, and display orders. |
| `RoleManagement` | Defines user tiers (Admin, Manager, User). |
| `PrivilegeManagement` | **The Matrix** – Maps Menu IDs to Role IDs to control visibility. |
| `UserManagement` | Stores bcrypt-hashed passwords, linked to a specific Role. |

### Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    RoleManagement ||--o{ UserManagement : "assigned to"
    RoleManagement ||--o{ PrivilegeManagement : "granted via"
    MenuManagement ||--o{ PrivilegeManagement : "exposed via"

    MenuManagement {
        int menu_id PK
        string menu_name
        string menu_code UK
        string menu_link
        int display_order
        string menu_icon
        boolean is_active
        boolean is_deleted
    }

    RoleManagement {
        int role_id PK
        string role
        string role_code UK
        boolean is_active
        boolean is_deleted
    }

    PrivilegeManagement {
        int privilege_id PK
        int menu_id FK
        int role_id FK
        boolean is_active
    }

    UserManagement {
        int user_id PK
        string name
        string user_name UK
        string email UK
        string password
        int role_id FK
        boolean is_active
        boolean is_deleted
    }
```

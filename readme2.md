# struktur folder
/pages

│
├── login.tsx
├── unauthorized.tsx
│
├── registration/                 # LOKET ADMIN (petugas loket)
│   ├── index.tsx                 # dashboard
│   ├── patients/
│   │   ├── index.tsx             # patient list
│   │   └── [id].tsx              # patient detail
│   │   └── create.tsx              # patient detail
│   ├── visits/
│   │   └── create.tsx            # create new visit
│   └── queue.tsx                 # call next queue number
│
├── queue/
│   ├── display/                  # LOKET DISPLAY (TV)
│   │   └── index.tsx
│   └── take/                     # PATIENT TAKE QUEUE NUMBER
│       └── index.tsx
│
├── admin/                        # SUPERADMIN
│   ├── index.tsx
│   ├── users/
│   ├── doctors/
│   ├── nurses/
│   ├── poli/
│   └── medicines/
│
├── nurse/                        # PERAWAT
│   ├── index.tsx
│   ├── patients.tsx
│   └── ttv/
│       └── [visitId].tsx
│
├── doctor/                       # DOKTER
│   ├── index.tsx
│   ├── patients/
│   │   ├── [id].tsx              # patient detail + medical history
│   │   └── visit/
│   │       └── [visitId].tsx     # SOAP + prescription
│   └── prescriptions.tsx
│
├── pharmacy/                     # FARMASI
│   ├── index.tsx
│   ├── stock/
│   │   ├── index.tsx
│   │   └── add.tsx
│   └── prescriptions/
│       ├── index.tsx
│       └── [id].tsx
│
├── cashier/                      # KASIR
│   ├── index.tsx
│   └── invoices/
│       ├── index.tsx
│       └── [id].tsx
│
└── 404.tsx

/pages/api
│
├── auth/
│   ├── login.ts
│   ├── logout.ts
│   └── refresh.ts
│
├── master/
│   ├── users.ts
│   ├── doctors.ts
│   ├── nurses.ts
│   ├── departments.ts       # poli
│   └── medicines.ts
│
├── patients/
│   ├── search.ts
│   └── index.ts
│
├── visits/
│   ├── create.ts
│   ├── list.ts
│   ├── lock-ttv.ts
│   ├── input-ttv.ts
│   └── finish.ts
│
├── medical-records/
│   ├── soap.ts
│   └── history.ts
│
├── pharmacy/
│   ├── orders.ts
│   ├── dispense.ts
│   └── stock-update.ts
│
├── queue/
│   ├── next.ts
│   ├── reset.ts
│   └── current.ts
│
└── cashier/
    ├── invoices.ts
    └── pay.ts


/lib
│
├── supabase/
│   ├── client.ts
│   └── server.ts
│
├── auth/
│   ├── jwt.ts
│   └── middleware-role.ts
│
├── api/
│   ├── respond.ts
│   ├── validate.ts
│   └── error.ts
│
├── utils/
│   ├── date.ts
│   ├── format.ts
│   └── helpers.ts
│
├── domain/
│   ├── queue.ts
│   ├── visit.ts
│   ├── invoice.ts
│   └── prescription.ts
│
└── types/
    ├── supabase.ts
    ├── patient.ts
    ├── visit.ts
    ├── user.ts
    └── index.ts

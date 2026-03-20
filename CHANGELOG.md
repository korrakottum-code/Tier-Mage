# Changelog - Tier Coffee Management System

## 2026-03-20 - Major Updates & Fixes

### ✅ Fixed Issues

#### 1. **Removed Seed Data for Menu & Ingredients**
- ลบข้อมูล menu items และ ingredients ออกจาก `prisma/seed.ts`
- ตอนนี้เมนูและวัตถุดิบที่เพิ่มผ่าน UI สามารถแก้ไขและลบได้แล้ว
- เก็บเฉพาะข้อมูล config ที่จำเป็น (branches, users, categories, payment channels, shifts)

#### 2. **POS Add-ons/Modifiers System**
- เพิ่ม `AddOnsDialog` component สำหรับเลือก add-ons
- โหลด `menuOptions` ใน POS page
- แสดง add-ons ในตะกร้าพร้อมราคาเพิ่ม
- คำนวณราคารวม add-ons อัตโนมัติ
- **แก้ไขยอดรวมได้** - คลิกที่ยอดเงินเพื่อปรับแก้

#### 3. **Dashboard Filters**
- เพิ่ม **Date Picker** - เลือกดูข้อมูลย้อนหลังได้
- เพิ่ม **Category Filter** - กรองออเดอร์ตามหมวดหมู่เมนู
- เพิ่ม **Branch Filter** - กรองข้อมูลตามสาขา
- API `/api/dashboard` รองรับ query parameters: `date`, `categoryId`, `branchId`

#### 4. **Stock/Ingredients Page**
- เพิ่ม **Branch Filter** - กรองวัตถุดิบตามสาขา
- แก้ปัญหาข้อมูลซ้ำโดยใช้ branch filter

#### 5. **Analytics Improvements**
- เปลี่ยนจากแสดง Top 10 เป็น **Top 5** เมนูขายดี
- API `/api/analytics` ส่ง top 5 items

#### 6. **Employee Wage Optional for Admin**
- Admin role ไม่บังคับต้องใส่ค่าแรง
- แสดงข้อความ "(ไม่บังคับสำหรับ Admin)" ในฟอร์ม
- Validation ตรวจสอบ role ก่อนบังคับค่าแรง

### 📁 Files Modified

**Seed Data:**
- `prisma/seed.ts` - ลบ menu items, ingredients, recipes, menu options

**POS System:**
- `app/(dashboard)/pos/page.tsx` - เพิ่ม menuOptions query
- `components/pos/PosOrderPanel.tsx` - เพิ่ม AddOnsDialog component

**Dashboard:**
- `app/(dashboard)/dashboard/page.tsx` - เพิ่ม branches query
- `components/dashboard/DashboardClient.tsx` - เพิ่ม branch filter
- `app/api/dashboard/route.ts` - รองรับ branchId parameter

**Stock:**
- `components/stock/IngredientsTab.tsx` - เพิ่ม branch filter dropdown

**Analytics:**
- `app/api/analytics/route.ts` - เปลี่ยนเป็น top 5

**Employees:**
- `components/employees/EmployeesClient.tsx` - wage optional for Admin

### 🎯 Features Summary

**ระบบที่ทำงานได้เต็มรูปแบบ:**
- ✅ POS พร้อม add-ons และแก้ไขยอดได้
- ✅ Dashboard พร้อม date, category, branch filters
- ✅ Employee check-in/check-out
- ✅ Role-based access control
- ✅ Branch management
- ✅ Stock management พร้อม branch filter
- ✅ Analytics พร้อม Top 5 และ graphs
- ✅ History พร้อม date picker
- ✅ Menu & Recipe management
- ✅ Shift Closing
- ✅ Settlements
- ✅ Tickets system

**ข้อมูลที่ต้องเพิ่มผ่าน UI:**
- เมนูและหมวดหมู่
- วัตถุดิบ
- สูตรอาหาร (recipes)
- Menu options (add-ons)

### 🔧 Technical Details

**Stack:**
- Next.js 16 App Router
- TypeScript
- Tailwind CSS + shadcn/ui
- Prisma 7 + PostgreSQL
- NextAuth v5 JWT

**Test Accounts:**
- Admin: admin@tiercoffee.com / PIN: 0000
- Manager: manager@tiercoffee.com / PIN: 1111
- Staff: staff@tiercoffee.com / PIN: 2222

---

## Previous Updates

See git history for previous changes.

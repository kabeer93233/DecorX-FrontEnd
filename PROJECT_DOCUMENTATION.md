# DecorX - Interior Decoration E-Commerce Website

## 1. Project Title
**DecorX: AI-Powered Interior Decoration & Furniture E-Commerce Platform**

---

## 2. Project Overview
DecorX is a modern, fully functional e-commerce website for furniture and home decor with integrated AI-powered room visualization features. Users can browse products, manage shopping carts, visualize furniture in their own room photos using AI preview technology, and complete purchases through a streamlined checkout process.

---

## 3. Key Features

### Core E-Commerce Functionality
- **Product Catalog**: Browse 50+ furniture items across 6 categories (Sofas, Chairs, Tables, Beds, Storage, Lighting)
- **Shopping Cart**: Add/remove items, update quantities, real-time price calculations
- **Wishlist**: Save favorite products for later
- **Product Details**: Comprehensive product pages with images, descriptions, pricing, and ratings
- **User Authentication**: Login and signup pages with form validation
- **Search & Filter**: Category-based filtering and product search

### AI-Powered Features (Innovative)
- **AI Room Preview**: Upload room photos and virtually place furniture
- **Interactive Canvas**: Drag, resize, and position furniture overlays on room images
- **Before/After Comparison**: Slider to compare original room vs decorated version
- **Design Saving**: Save and manage multiple room design projects
- **Furniture Selection**: Choose from catalog to visualize in your space

### Additional Pages
- **Checkout Flow**: Complete order process with shipping and payment options
- **User Profile**: Order history, saved designs, account management
- **About Us**: Company information and brand story
- **Contact**: Contact form with location and support details

---

## 4. Tools & Technologies Used

### Frontend Framework
- **React 18.3.1**: Component-based UI library
- **TypeScript**: Type-safe JavaScript for better code quality
- **React Router DOM 7.13.0**: Client-side routing and navigation

### Styling & UI
- **Tailwind CSS 4.1.12**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives (40+ components)
- **Material-UI 7.3.5**: Pre-built React components
- **Lucide React**: Icon library (500+ icons)
- **Motion (Framer Motion) 12.23.24**: Animation library

### State Management
- **React Context API**: Global state for cart, wishlist, and user data
- **LocalStorage**: Client-side data persistence

### Form & Validation
- **React Hook Form 7.55.0**: Form handling and validation

### UI Components & Libraries
- **React Slick**: Carousel/slider components
- **Recharts 2.15.2**: Data visualization (if needed for analytics)
- **React DnD**: Drag-and-drop functionality for AI canvas
- **Sonner**: Toast notifications
- **Date-fns**: Date formatting and manipulation

### Build Tools
- **Vite 6.3.5**: Fast build tool and development server
- **PostCSS**: CSS processing

### Image Handling
- **Unsplash API**: High-quality furniture and interior images

---

## 5. Project Structure

```
src/
├── app/
│   ├── App.tsx                 # Main application component with routing
│   └── components/
│       ├── ui/                 # Reusable UI components (40+ components)
│       └── figma/              # Image handling utilities
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx          # Navigation header with cart/wishlist badges
│   │   ├── Footer.tsx          # Site footer with links
│   │   └── Layout.tsx          # Main layout wrapper
│   │
│   ├── ui/
│   │   ├── ProductCard.tsx     # Product display card
│   │   └── SectionHeading.tsx  # Styled section headers
│   │
│   ├── ai/                     # AI Preview feature components
│   │   ├── RoomUploader.tsx    # Upload room images
│   │   ├── FurnitureSelector.tsx # Select furniture from catalog
│   │   ├── PreviewCanvas.tsx   # Interactive canvas for furniture placement
│   │   ├── PositionControls.tsx # Controls for positioning/sizing
│   │   ├── BeforeAfterSlider.tsx # Comparison slider
│   │   └── ResultPreview.tsx   # Final design preview
│   │
│   ├── checkout/
│   │   ├── ShippingForm.tsx    # Shipping information form
│   │   ├── PaymentSection.tsx  # Payment method selection
│   │   └── OrderSummary.tsx    # Cart summary and totals
│   │
│   └── profile/
│       ├── UserInfo.tsx        # User account details
│       ├── OrderHistory.tsx    # Past orders display
│       └── SavedDesigns.tsx    # Saved AI room designs
│
├── pages/
│   ├── Home.tsx                # Landing page with hero, featured products
│   ├── Shop.tsx                # Product catalog with filters
│   ├── ProductDetails.tsx      # Individual product page
│   ├── Cart.tsx                # Shopping cart management
│   ├── Wishlist.tsx            # Saved products
│   ├── About.tsx               # Company information
│   ├── Contact.tsx             # Contact form
│   ├── Login.tsx               # User login
│   ├── Signup.tsx              # User registration
│   ├── AIPreview.tsx           # AI room visualization tool
│   ├── Checkout.tsx            # Order checkout process
│   └── Profile.tsx             # User dashboard
│
├── context/
│   └── ShopContext.tsx         # Global state management (cart, wishlist)
│
├── services/
│   ├── aiService.ts            # AI preview logic and canvas handling
│   ├── orderService.ts         # Order processing and storage
│   └── profileService.ts       # User profile and design management
│
├── data/
│   └── products.ts             # Product catalog data (50+ items)
│
├── types/
│   └── index.ts                # TypeScript interfaces and types
│
└── styles/
    ├── index.css               # Global styles
    ├── tailwind.css            # Tailwind configuration
    ├── theme.css               # Custom theme tokens
    └── fonts.css               # Font imports
```

---

## 6. Implementation Details

### A. Architecture & Design Patterns

**1. Component-Based Architecture**
- Modular React components for reusability
- Separation of concerns (layout, pages, components, services)
- Atomic design principles (atoms → molecules → organisms)

**2. State Management**
- Context API for global state (ShopContext)
- LocalStorage for data persistence
- Interfaces for type safety

**3. Routing Strategy**
- React Router with 12 defined routes
- Scroll-to-top on route change
- Layout wrapper for consistent navigation

### B. Core Features Implementation

**1. Product Catalog System**
```typescript
- 50+ products with properties: id, name, category, price, image, description, rating
- Categories: Sofas, Chairs, Tables, Beds, Storage, Lighting
- Dynamic filtering and sorting
- Responsive product cards with hover effects
```

**2. Shopping Cart Logic**
```typescript
- Add to cart with quantity
- Update quantities (+/-)
- Remove items
- Calculate subtotal, tax, shipping
- Persist in localStorage
- Badge counter in navbar
```

**3. AI Room Preview (Canvas Implementation)**
```typescript
Step 1: User uploads room image (RoomUploader)
Step 2: Select furniture from catalog (FurnitureSelector)
Step 3: Furniture overlays on canvas as draggable/resizable element
Step 4: Position controls for fine-tuning (rotation, scale, position)
Step 5: Before/After slider for comparison
Step 6: Save design to profile (localStorage)
```

**4. Checkout Flow**
```typescript
Step 1: Review cart items (OrderSummary)
Step 2: Fill shipping form (name, phone, address, city, postal code)
Step 3: Select payment method (COD or Card)
Step 4: Place order → Save to localStorage
Step 5: Redirect to profile/order history
```

### C. Design System

**Color Palette**
- Background: Cream (#FFF8F0, #FFFBF5)
- Primary: Orange (#FF6B35, #FF8C42)
- Text: Dark Gray (#333333, #666666)
- Accents: Light gray borders, white cards

**Typography**
- Clean, modern sans-serif fonts
- Responsive font sizes
- Clear hierarchy

**UI/UX Principles**
- Mobile-first responsive design
- Smooth animations with Motion library
- Accessible components (Radix UI)
- Intuitive navigation
- Clear CTAs (Call-to-Action buttons)

### D. Data Flow

```
User Interaction
    ↓
React Components
    ↓
Context API (ShopContext)
    ↓
Services (aiService, orderService, profileService)
    ↓
LocalStorage (Persistence)
```

### E. Key Technical Decisions

1. **Why LocalStorage?**
   - No backend required for prototype
   - Instant data persistence
   - Works offline
   - Simple implementation

2. **Why React Context?**
   - Lightweight state management
   - No external dependencies
   - Perfect for small to medium apps
   - Easy to implement and understand

3. **Why Tailwind CSS?**
   - Rapid development
   - Utility-first approach
   - Responsive design made easy
   - Small bundle size

4. **Why React Router?**
   - Standard for React SPAs
   - Declarative routing
   - Dynamic route parameters

---

## 7. Features Breakdown

### Standard E-Commerce Features
✅ Product browsing and search  
✅ Shopping cart with CRUD operations  
✅ Wishlist functionality  
✅ Product detail pages  
✅ User authentication UI  
✅ Checkout process  
✅ Order management  
✅ Responsive design  

### Advanced AI Features
✅ Room image upload  
✅ Furniture overlay on canvas  
✅ Drag-and-drop positioning  
✅ Resize and rotate controls  
✅ Before/After comparison slider  
✅ Save multiple designs  
✅ Design management in profile  

---

## 8. User Flow Examples

### Flow 1: Traditional Shopping
1. Browse products on Shop page
2. Click product → View details
3. Add to cart
4. Go to cart → Update quantities
5. Proceed to checkout
6. Fill shipping info
7. Select payment method
8. Place order
9. View order in profile

### Flow 2: AI-Powered Shopping
1. Go to AI Preview page
2. Upload room photo
3. Select furniture from catalog
4. Position and resize on canvas
5. Use before/after slider to compare
6. Save design
7. Add furniture to cart
8. Proceed to checkout
9. Complete purchase

---

## 9. Technical Highlights

### Performance Optimizations
- Lazy loading for images
- React component memoization
- Vite for fast builds
- Optimized bundle size

### Responsive Design
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px
- Fluid typography and spacing

### Code Quality
- TypeScript for type safety
- Modular component structure
- Reusable custom hooks
- Clean, readable code

### User Experience
- Smooth page transitions
- Loading states
- Error handling
- Toast notifications
- Intuitive navigation
- Clear visual feedback

---

## 10. Future Enhancements (Potential)

- Backend integration (Node.js/Express or Firebase)
- Real AI image processing (Stable Diffusion API)
- User authentication with JWT
- Payment gateway integration (Stripe/PayPal)
- Product reviews and ratings
- Admin dashboard for product management
- Email notifications
- Advanced search with autocomplete
- Social sharing
- Multi-language support

---

## 11. Learning Outcomes

### Technical Skills Developed
- React ecosystem mastery
- TypeScript implementation
- State management patterns
- Responsive design with Tailwind
- Canvas API manipulation
- Form handling and validation
- Routing in single-page applications
- Component composition
- API integration concepts

### Software Engineering Practices
- Project structure organization
- Code modularity and reusability
- Type safety and error prevention
- User-centric design thinking
- Agile development approach

---

## 12. Conclusion

DecorX demonstrates a comprehensive e-commerce solution with innovative AI-powered room visualization. The project combines modern web technologies (React, TypeScript, Tailwind CSS) with thoughtful UX design to create a fully functional furniture shopping platform. The AI preview feature sets it apart from traditional e-commerce sites, allowing users to visualize products in their own spaces before purchase.

**Project Status**: ✅ Fully Functional Prototype  
**Lines of Code**: ~5,000+  
**Components**: 60+ React components  
**Routes**: 12 pages  
**Product Catalog**: 50+ items  

---

## 13. Quick Stats

| Metric | Count |
|--------|-------|
| Total Pages | 12 |
| React Components | 60+ |
| Product Categories | 6 |
| Products in Catalog | 50+ |
| npm Dependencies | 40+ |
| Code Files | 70+ |
| Routes | 12 |
| Services | 3 |

---

**Developed By**: [Muhammad Kabeer]  
**Tech Stack**: React + TypeScript + Tailwind CSS + Vite

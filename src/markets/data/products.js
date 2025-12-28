// data/products.js
export const products = [
    {
        id: 1,
        name: "Wireless Bluetooth Headphones",
        description: "High-quality wireless headphones with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals who need reliable audio performance throughout the day.",
        price: 79.99,
        originalPrice: 99.99,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
        images: [
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
            "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600",
            "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600",
            "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600"
        ],
        category: "Electronics",
        rating: 4.5,
        reviews: 128,
        sold: 450,
        stock: 25,
        discount: 20,
        features: ["Active Noise Cancellation", "30-hour Battery Life", "Quick Charge (5 min = 2 hours)", "Bluetooth 5.0", "Voice Assistant Support"],
        colors: ["Black", "Silver", "Blue"],
        sizes: ["One Size"],
        specifications: {
            "Battery Life": "30 hours",
            "Charging Time": "2 hours",
            "Connectivity": "Bluetooth 5.0",
            "Weight": "265g",
            "Warranty": "2 years",
            "Noise Cancellation": "Active"
        },
        brand: "AudioPro"
    },
    {
        id: 2,
        name: "Smart Fitness Watch",
        description: "Track your heart rate, steps, and sleep patterns with this advanced smartwatch. Stay connected and monitor your health with precision.",
        price: 199.99,
        originalPrice: 249.99,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
        images: [
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
            "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=600",
            "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600"
        ],
        category: "Electronics",
        rating: 4.2,
        reviews: 89,
        sold: 320,
        stock: 15,
        discount: 20,
        features: ["Heart Rate Monitor", "GPS Tracking", "Water Resistant (50m)", "Sleep Analysis", "Smart Notifications"],
        colors: ["Black", "Silver", "Rose Gold"],
        sizes: ["Small", "Medium", "Large"],
        specifications: {
            "Display": "1.3\" AMOLED",
            "Battery Life": "7 days",
            "Water Resistance": "50 meters",
            "GPS": "Built-in",
            "Compatibility": "iOS & Android",
            "Sensors": "Heart Rate, SpO2, Accelerometer"
        },
        brand: "FitTech"
    },
    {
        id: 3,
        name: "Organic Cotton T-Shirt",
        description: "Comfortable and sustainable organic cotton t-shirt available in multiple colors. Perfect for everyday wear with a perfect fit.",
        price: 24.99,
        originalPrice: 29.99,
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
        images: [
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600",
            "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600",
            "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600"
        ],
        category: "Clothing",
        rating: 4.7,
        reviews: 256,
        sold: 1200,
        stock: 50,
        discount: 17,
        features: ["100% Organic Cotton", "Multiple Colors", "Machine Washable", "Pre-shrunk", "Breathable Fabric"],
        colors: ["White", "Black", "Navy", "Gray", "Green"],
        sizes: ["XS", "S", "M", "L", "XL", "XXL"],
        specifications: {
            "Material": "100% Organic Cotton",
            "Care": "Machine Washable",
            "Fit": "Regular",
            "Neck": "Crew Neck",
            "Sleeve": "Short Sleeve"
        },
        brand: "EcoWear"
    },
    {
        id: 4,
        name: "Stainless Steel Water Bottle",
        description: "Keep your drinks hot or cold for hours with this insulated stainless steel bottle. Eco-friendly and durable design.",
        price: 34.99,
        originalPrice: 39.99,
        image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400",
        images: [
            "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600",
            "https://images.unsplash.com/photo-1589363460777-41767c4c00e0?w=600",
            "https://images.unsplash.com/photo-1602488257131-48fb4be0756d?w=600"
        ],
        category: "Sports",
        rating: 4.4,
        reviews: 167,
        sold: 890,
        stock: 100,
        discount: 13,
        features: ["Double Wall Insulation", "BPA Free", "24h Cold / 12h Hot", "Leak Proof", "Eco Friendly"],
        colors: ["Silver", "Black", "Blue", "Green"],
        sizes: ["500ml", "750ml", "1L"],
        specifications: {
            "Capacity": "1 Liter",
            "Material": "18/8 Stainless Steel",
            "Insulation": "Double Wall Vacuum",
            "Lid Type": "Screw Top",
            "Weight": "380g"
        },
        brand: "HydroFlask"
    },
    {
        id: 5,
        name: "Professional Camera Lens",
        description: "High-performance camera lens perfect for portrait and landscape photography. Crystal clear optics and fast autofocus.",
        price: 599.99,
        originalPrice: 749.99,
        image: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400",
        images: [
            "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=600",
            "https://images.unsplash.com/photo-1616348436166-6271c8b8c6d0?w=600",
            "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600"
        ],
        category: "Electronics",
        rating: 4.8,
        reviews: 42,
        sold: 85,
        stock: 8,
        discount: 20,
        features: ["Image Stabilization", "Weather Sealed", "Fast Autofocus", "Ultra Sonic Motor", "Low Dispersion Glass"],
        colors: ["Black"],
        sizes: ["Canon EF", "Nikon F", "Sony E"],
        specifications: {
            "Focal Length": "50mm",
            "Aperture": "f/1.8",
            "Mount": "Canon EF",
            "Stabilization": "Yes",
            "Filter Size": "58mm",
            "Weight": "430g"
        },
        brand: "Canon"
    },
    {
        id: 6,
        name: "Yoga Mat Premium",
        description: "Eco-friendly non-slip yoga mat with carrying strap and alignment markers. Perfect for all types of yoga practice.",
        price: 45.99,
        originalPrice: 59.99,
        image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
        images: [
            "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600",
            "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600",
            "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=600"
        ],
        category: "Sports",
        rating: 4.6,
        reviews: 203,
        sold: 560,
        stock: 35,
        discount: 23,
        features: ["Non-slip Surface", "Eco-friendly TPE", "Includes Strap", "Alignment Markers", "Extra Thick"],
        colors: ["Purple", "Blue", "Green", "Pink"],
        sizes: ["Standard (68\" x 24\")", "Long (72\" x 24\")", "Extra Thick (6mm)"],
        specifications: {
            "Material": "TPE (Eco-friendly)",
            "Dimensions": "68\" x 24\"",
            "Thickness": "6mm",
            "Weight": "2.2kg",
            "Includes": "Mat + Carry Strap"
        },
        brand: "YogaLife"
    },
    {
        id: 7,
        name: "Wireless Gaming Mouse",
        description: "High-precision wireless gaming mouse with RGB lighting and customizable buttons for professional gamers.",
        price: 89.99,
        originalPrice: 119.99,
        image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400",
        images: [
            "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600",
            "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=600",
            "https://images.unsplash.com/photo-1563297007-0686b7003af7?w=600"
        ],
        category: "Electronics",
        rating: 4.3,
        reviews: 156,
        sold: 320,
        stock: 22,
        discount: 25,
        features: ["RGB Lighting", "Customizable Buttons", "16000 DPI", "Wireless 2.4Ghz", "50h Battery"],
        colors: ["Black", "White"],
        sizes: ["Right-handed", "Left-handed"],
        specifications: {
            "Sensor": "Optical 16000 DPI",
            "Connectivity": "2.4Ghz Wireless + Bluetooth",
            "Battery": "50 hours",
            "Buttons": "8 Programmable",
            "Weight": "95g"
        },
        brand: "GamePro"
    },
    {
        id: 8,
        name: "Running Shoes",
        description: "Lightweight running shoes with superior cushioning and breathable mesh for maximum comfort during workouts.",
        price: 129.99,
        originalPrice: 159.99,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
        images: [
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
            "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600",
            "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600"
        ],
        category: "Sports",
        rating: 4.5,
        reviews: 289,
        sold: 780,
        stock: 45,
        discount: 19,
        features: ["Breathable Mesh", "Advanced Cushioning", "Non-slip Sole", "Lightweight", "Multiple Colors"],
        colors: ["Black/Red", "White/Blue", "Gray/Orange", "Black/White"],
        sizes: ["US 7", "US 8", "US 9", "US 10", "US 11", "US 12"],
        specifications: {
            "Weight": "280g (per shoe)",
            "Drop": "8mm",
            "Type": "Neutral Running",
            "Closure": "Lace-up",
            "Water Resistance": "No"
        },
        brand: "RunMax"
    }
];
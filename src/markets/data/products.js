export const productsResponse = {
    message: "Items selected successfully",
    status: 200,
    data: [
        {
            id: 58,
            barcode: "010426041000001",
            code: "43242343564",
            name: "P.Test",
            price: 3,
            cost: 0,
            price_discount: 2.7,
            image: "https://api.chomnenhapp.com/storage/images/1775810544_69d8b7f04d5bd.jpg",
            images: [
                {
                    image_id: 47,
                    image: "https://api.chomnenhapp.com/storage/images/1775810544_69d8b7f04d5bd.jpg",
                },
                {
                    image_id: 48,
                    image: "https://api.chomnenhapp.com/storage/images/1775810544_69d8b7f0559b1.jpg",
                },
            ],
            category_id: 5,
            category_name: "សាប៊ូ",
            brand_id: 1,
            brand_name: "កូរ៉េ",
            scale_id: 3,
            scale_name: "ដប",
            stock: {
                in_stock: 20,
                stock_return: 0,
                stock_in: 20,
                stock_out: 0,
                stock_wasted: 0,
                sold: 0,
            },
            discount: 10,
            attributes: [
                {
                    id: 1,
                    name: "size",
                    value: "500ml",
                },
                {
                    id: 4,
                    name: "colors",
                    value: [
                        {
                            id: 393,
                            value: "#962598",
                        },
                    ],
                },
            ],
            created_at: "2026-04-10 08:42:24",
            updated_at: "2026-04-10 08:42:24",
            description: null,
        },
    ],
};

export const products = productsResponse.data;

export default productsResponse;

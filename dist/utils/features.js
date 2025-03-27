import mongoose from "mongoose";
import { myCache } from "../app.js";
import { Product } from "../models/products.js";
export const connectDB = (uri) => {
    mongoose.connect(uri, {
        dbName: "Ecommerce_24"
    }).then((c) => console.log(`Database connected to ${c.connection.host}`)).
        catch(e => console.log(e));
};
export const invalidatesCache = async ({ product, order, admin, userId, orderId, productId }) => {
    if (product) {
        const productKeys = ["latest-product",
            "categories",
            "all-products",
            `product-${productId}`
        ];
        if (typeof (productId) === "string")
            productKeys.push(`product-${productId}`);
        if (typeof (productId) === "object")
            productId.forEach((i) => productKeys.push(`product-${i}`));
        myCache.del(productKeys);
    }
    if (order) {
        const orderKeys = ["all-orders", `my-orders-${userId}`, `order-${orderId}`];
        myCache.del(orderKeys);
    }
    if (admin) {
        myCache.del(["admin-stats", "admin-pie-chart", "admin-line-chart", "admuin-bar-chart"]);
    }
};
export const reduceStock = async (orderItems) => {
    for (let i = 0; i < orderItems.length; i++) {
        const order = orderItems[i];
        const product = await Product.findById(order.productId);
        if (!product)
            throw new Error("Product not found");
        product.stock -= order.quantity;
        await product.save();
    }
};
export const calculatePercentage = (thisMonth, lastMonth) => {
    if (lastMonth === 0) {
        return thisMonth * 100;
    }
    const percent = ((thisMonth - lastMonth) / lastMonth) * 100;
    return Number(percent.toFixed(0));
};
export const getInventories = async ({ Categories, productCount }) => {
    const CategoriesCountWithPromise = Categories.map(category => Product.countDocuments({ category }));
    const categoriesCount = await Promise.all(CategoriesCountWithPromise);
    const categoryCount = [];
    Categories.forEach((category, i) => {
        categoryCount.push({
            [category]: Math.round((categoriesCount[i] / productCount) * 100),
        });
    });
    return categoryCount;
};
export const getChartData = async ({ length, docArr, today, property }) => {
    const data = new Array(length).fill(0);
    docArr.forEach((i) => {
        const creationDate = i.createdAt;
        const monthDifference = (today.getMonth() - creationDate.getMonth() + 12) % 12;
        if (monthDifference < length) {
            if (property) {
                data[length - monthDifference - 1] += i.discount;
            }
            else {
                data[length - monthDifference - 1] += 1;
            }
        }
    });
    return data;
};

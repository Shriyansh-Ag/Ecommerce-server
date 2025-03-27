import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { Product } from "../models/products.js";
import { User } from "../models/user.js";
import { calculatePercentage, getChartData, getInventories } from "../utils/features.js";
export const getDashboardStats = TryCatch(async (req, res, next) => {
    let stats = {};
    if (myCache.has("admin-stats"))
        stats = JSON.parse(myCache.get("admin-stats"));
    else {
        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const thisMonth = {
            start: new Date(today.getFullYear(), today.getMonth(), 1),
            end: today
        };
        const lastMonth = {
            start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
            end: new Date(today.getFullYear(), today.getMonth(), 0)
        };
        const thisMonthProductsPromise = await Product.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end
            }
        });
        const lastMonthProductsPromise = await Product.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end
            }
        });
        const thisMonthUsersPromise = await User.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end
            }
        });
        const lastMonthUsersPromise = await User.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end
            }
        });
        const thisMonthOrdersPromise = await Order.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end
            }
        });
        const lastMonthOrdersPromise = await Order.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end
            }
        });
        const lastSixMonthOrdersPromise = await Order.find({
            createdAt: {
                $gte: sixMonthsAgo,
                $lte: lastMonth.end
            }
        });
        const latestTransactionsPromise = Order.find({}).select(["orderItems", "discount", "total", "status"]).limit(4);
        const [thisMonthOrders, thisMonthProducts, thisMonthUsers, lastMonthOrders, lastMonthProducts, lastMonthUsers, allOrders, productCount, userCount, lastSixMonthOrders, Categories, femaleUserCount, latestTransactions] = await Promise.all([
            thisMonthOrdersPromise,
            thisMonthProductsPromise,
            thisMonthUsersPromise,
            lastMonthOrdersPromise,
            lastMonthProductsPromise,
            lastMonthUsersPromise,
            Order.find({}).select("total"),
            Product.countDocuments(),
            User.countDocuments(),
            lastSixMonthOrdersPromise,
            Product.distinct("category"),
            User.countDocuments({ gender: "female" }),
            latestTransactionsPromise
        ]);
        const thisMonthRevenue = thisMonthOrders.reduce((total, order) => total + (order.total || 0), 0);
        const lastMonthRevenue = lastMonthOrders.reduce((total, order) => total + (order.total || 0), 0);
        const percentageChange = {
            revenue: calculatePercentage(thisMonthRevenue, lastMonthRevenue),
            product: calculatePercentage(thisMonthProducts.length, lastMonthProducts.length),
            order: calculatePercentage(thisMonthOrders.length, lastMonthOrders.length),
            user: calculatePercentage(thisMonthUsers.length, lastMonthUsers.length)
        };
        const Revenue = allOrders.reduce((total, order) => total + (order.total || 0), 0);
        const counts = {
            revenue: Revenue,
            user: userCount,
            product: productCount,
            order: allOrders.length
        };
        const orderMonthCounts = new Array(6).fill(0);
        const MonthlyRevenue = new Array(6).fill(0);
        lastSixMonthOrders.forEach((order) => {
            const creationDate = order.createdAt;
            const monthDifference = (today.getMonth() - creationDate.getMonth() + 12) % 12;
            if (monthDifference < 6) {
                orderMonthCounts[6 - monthDifference - 1] += 1;
                MonthlyRevenue[6 - monthDifference - 1] += order.total;
            }
        });
        const categoryCount = await getInventories({ Categories, productCount });
        const userratio = {
            male: userCount - femaleUserCount,
            female: femaleUserCount
        };
        const modifiedlatestTransaction = latestTransactions.map(i => ({
            _id: i._id,
            discount: i.discount,
            amount: i.total,
            quantity: i.orderItems.length,
            status: i.status
        }));
        stats = {
            categoryCount,
            percentageChange,
            counts,
            chart: {
                order: orderMonthCounts,
                revenue: MonthlyRevenue
            },
            userratio,
            modifiedlatestTransaction
        };
        myCache.set("admin-stats", JSON.stringify(stats));
    }
    res.status(200).json({
        success: true,
        stats
    });
});
export const getPieChart = TryCatch(async (req, res, next) => {
    let charts;
    if (myCache.has("admin-pie-charts"))
        charts = JSON.parse(myCache.get("admin-pie-charts"));
    else {
        const allOrderPromise = Order.find({}).select(["total", "discount", "subtotal", "tax", "shippingCharges"]);
        const [ProcessingOrder, ShippedOrder, DeliveredOrder, Categories, productCount, OutofStock, allOrders, allUsers, adminCount, CustomerCount] = await Promise.all([
            Order.countDocuments({ status: "Processing" }),
            Order.countDocuments({ status: "Shipped" }),
            Order.countDocuments({ status: "Delivered" }),
            Product.distinct("category"),
            Product.countDocuments(),
            Product.countDocuments({ stock: 0 }),
            allOrderPromise,
            User.find({}).select(["dob"]),
            User.countDocuments({ role: "admin" }),
            User.countDocuments({ role: "user" })
        ]);
        const orderFullfillment = {
            processing: ProcessingOrder,
            shipped: ShippedOrder,
            delivered: DeliveredOrder
        };
        const productCategories = await getInventories({ Categories, productCount });
        const stockAvailaibility = {
            inStock: productCount - OutofStock,
            OutofStock
        };
        const GrossIncome = allOrders.reduce((prev, order) => prev + (order.total || 0), 0);
        const discount = allOrders.reduce((prev, order) => prev + (order.discount || 0), 0);
        const productionCost = allOrders.reduce((prev, order) => prev + (order.shippingCharges || 0), 0);
        const burnt = allOrders.reduce((prev, order) => prev + (order.tax || 0), 0);
        const marketingCost = Math.round(GrossIncome * 0.3);
        const netMargin = GrossIncome - (discount + productionCost + burnt + marketingCost);
        const RevenueDistribution = await {
            netMargin,
            discount,
            productionCost,
            burnt,
            marketingCost
        };
        const userAgeGroup = {
            teen: allUsers.filter((i) => i.age < 18).length,
            adult: allUsers.filter((i) => i.age >= 18 && i.age < 55).length,
            Senior: allUsers.filter((i) => i.age >= 55).length
        };
        const adminUsers = {
            admin: adminCount,
            customers: CustomerCount
        };
        charts = {
            orderFullfillment,
            productCategories,
            stockAvailaibility,
            RevenueDistribution,
            adminUsers,
            userAgeGroup,
        };
        myCache.set("admin-pie-charts", JSON.stringify(charts));
    }
    res.status(200).json({
        success: true,
        charts
    });
});
export const getBarChart = TryCatch(async (req, res, next) => {
    let charts;
    const key = "admin-bar-charts";
    if (myCache.has(key))
        charts = JSON.parse(myCache.get(key));
    else {
        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        const SixMonthProductsPromise = await Product.find({
            createdAt: {
                $gte: sixMonthsAgo,
                $lte: today
            }
        }).select("createdAt");
        const SixMonthUsersPromise = await User.find({
            createdAt: {
                $gte: sixMonthsAgo,
                $lte: today
            }
        }).select("createdAt");
        const twelveMonthOrdersPromise = await Order.find({
            createdAt: {
                $gte: twelveMonthsAgo,
                $lte: today
            }
        }).select("createdAt");
        const [SixMonthProducts, SixMonthUsers, twelveMonthOrders] = await Promise.all([
            SixMonthProductsPromise,
            SixMonthUsersPromise,
            twelveMonthOrdersPromise
        ]);
        const productCount = getChartData({ length: 6, today, docArr: SixMonthProducts });
        const UserCount = getChartData({ length: 6, today, docArr: SixMonthUsers });
        const OrderCount = getChartData({ length: 12, today, docArr: twelveMonthOrders });
        charts = {
            product: productCount,
            user: UserCount,
            order: OrderCount
        };
        myCache.set(key, JSON.stringify(charts));
    }
    res.status(200).json({
        success: true,
        charts
    });
});
export const getLineChart = TryCatch(async (req, res, next) => {
    let charts;
    const key = "admin-line-charts";
    if (myCache.has(key))
        charts = JSON.parse(myCache.get(key));
    else {
        const today = new Date();
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        const twelveMonthProductsPromise = await Product.find({
            createdAt: {
                $gte: twelveMonthsAgo,
                $lte: today
            }
        }).select("createdAt");
        const twelveMonthUsersPromise = await User.find({
            createdAt: {
                $gte: twelveMonthsAgo,
                $lte: today
            }
        }).select("createdAt");
        const twelveMonthOrdersPromise = await Order.find({
            createdAt: {
                $gte: twelveMonthsAgo,
                $lte: today
            }
        }).select(["createdAt", "discount", "total"]);
        const [twelveMonthProducts, twelveMonthUsers, twelveMonthOrders] = await Promise.all([
            twelveMonthProductsPromise,
            twelveMonthUsersPromise,
            twelveMonthOrdersPromise
        ]);
        const productCount = getChartData({ length: 12, today, docArr: twelveMonthProducts });
        const UserCount = getChartData({ length: 12, today, docArr: twelveMonthUsers });
        const discount = getChartData({ length: 12, today, docArr: twelveMonthOrders, property: "discount" });
        const revenue = getChartData({ length: 12, today, docArr: twelveMonthOrders, property: "total" });
        charts = {
            product: productCount,
            user: UserCount,
            discount,
            revenue
        };
        myCache.set(key, JSON.stringify(charts));
    }
    res.status(200).json({
        success: true,
        charts
    });
});

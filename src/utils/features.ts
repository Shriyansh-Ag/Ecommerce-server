import  mongoose, { Document }  from "mongoose"
import { invalidatesCacheProps, OrderItemType } from "../types/types.js";
import { myCache } from "../app.js";
import { Product } from "../models/products.js";
import { allOrders } from "../controllers/order.js";
import { Order } from "../models/order.js";


export const connectDB =(uri:string)=>{

    mongoose.connect(uri,{
        dbName: "Ecommerce_24"
    }).then((c) => console.log(`Database connected to ${c.connection.host}`)).
    catch( e=>console.log(e));
}


export const invalidatesCache = async({product,order,admin,userId,orderId,productId}:invalidatesCacheProps) => {

    if(product){

        const productKeys: string[] = ["latest-product",
            "categories",
            "all-products",
            `product-${productId}`
            ];
            if (typeof(productId) === "string") productKeys.push(`product-${productId}`);

            if(typeof(productId)=== "object") productId.forEach((i) => productKeys.push(`product-${i}`));
        myCache.del(productKeys)    
    }
    if(order){
        const orderKeys : string[] = ["all-orders",`my-orders-${userId}`,`order-${orderId}`];

        myCache.del(orderKeys)
    }
    if(admin){
        myCache.del(["admin-stats","admin-pie-chart","admin-line-chart","admuin-bar-chart"])
    }

}

export const reduceStock = async (orderItems: OrderItemType[]) =>{
    for (let i = 0; i < orderItems.length; i++) {
        const order = orderItems[i];
        const product = await Product.findById(order.productId)
        if(!product) throw new Error("Product not found")
        product.stock -= order.quantity
        await product.save()
    }
};


export const calculatePercentage = (thisMonth:number , lastMonth: number) =>{
    if(lastMonth===0){
        return thisMonth*100
    }
    const percent = ((thisMonth-lastMonth)/lastMonth)*100;
    return Number(percent.toFixed(0))
}

export const getInventories = async ({Categories, productCount}:
    {Categories : string[] ;
    productCount : number 
    }) =>{

    const CategoriesCountWithPromise = Categories.map(category=> Product.countDocuments({category}))
    const categoriesCount = await Promise.all(CategoriesCountWithPromise)
    const categoryCount:Record<string,number>[] = [];

    Categories.forEach((category , i) =>{
        categoryCount.push({
            [category]: Math.round((categoriesCount[i]/ productCount )*100),
        });
    });

    return categoryCount

}
interface MyDocument extends Document{
    createdAt: Date,
    discount?: number,
    total?: number
}

type FuncProps ={
    length: number,
    docArr: MyDocument[],
    today: Date,
    property?: string
}

export const getChartData = async ({length,docArr,today,property}:
    FuncProps) => {
    const data = new Array(length).fill(0);
    docArr.forEach((i) => {

        const creationDate = i.createdAt
        const monthDifference = (today.getMonth() - creationDate.getMonth() + 12)%12
        
        if(monthDifference < length ){
            if(property){
                data[length-monthDifference-1] += i.discount
            }
            else{
                data[length-monthDifference-1] += 1
            }
            
        }
    })
    return data
}
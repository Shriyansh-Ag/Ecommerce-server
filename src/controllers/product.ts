import {  Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import { NewProductRequestBody, SearchRequestQuery , BaseQuery } from "../types/types.js";
import { Product } from "../models/products.js";
import ErrorHandler from "../utils/utility-classes.js";
import { rm } from "fs";
import { myCache } from "../app.js";
import { invalidatesCache } from "../utils/features.js";
//import { faker } from '@faker-js/faker'



//Revalidate on new,update,delete product 
export const getlatestProducts= TryCatch(async(
    req,res,next)=>{

    let products;

    if (myCache.has("latest-product")) products = JSON.parse(myCache.get("latest-product") as string);
    else{
        products = await Product.find({}).sort({createdAt:-1}).limit(5);
        myCache.set("latest-product",JSON.stringify(products))
    }

    res.status(200).json({
        success:true,
        products,
    })
    }
    )

//Revalidate on new,update,delete product 
export const getCategories= TryCatch(async(
        req,res,next)=>{

        let categories;

        if(myCache.has("categories")) categories = JSON.parse(myCache.get("categories") as string)
        else{
            categories = await Product.distinct("category")
            myCache.set("categories",JSON.stringify(categories))
        }

                
        res.status(200).json({
            success:true,
            categories,
        })
        }
        )

export const getAdminProducts= TryCatch(async(
    req,res,next)=>{
            
            let products;

            if (myCache.has("all-products")) products = JSON.parse(myCache.get("all-products") as string);
            else{
                products = await Product.find({})
                myCache.set("all-products",JSON.stringify(products))
            }
                    
            res.status(200).json({
                success:true,
                products,
})
})

export const getSingleProduct= TryCatch(async(
    req,res,next)=>{

            let product;
            const id = req.params.id
            if (myCache.has(`product-${id}`)) product = JSON.parse(myCache.get(`product-${id}`) as string);
            else{
                product = await Product.findById(id);
                if(!product) return next(new ErrorHandler("Invalid Product ID" , 404));
                myCache.set(`product-${id}`,JSON.stringify(product))
            }
            
            res.status(200).json({
                success:true,
                product,
})
})

export const newProduct = TryCatch(async(
    req:Request<{},{},NewProductRequestBody>,res:Response,next)=>{
    
            const{name,price,stock,category} = req.body;
            const photo = req.file
             if(!photo) return next(new ErrorHandler("Please add photo", 400));
                
             if(!name || !price || !stock || !category)
             {
                rm(photo.path , ()=>{
                    console.log("Deleted")
                })
                return next(new ErrorHandler("Please enter all fields",400));
    
             }
    
    await Product.create({
    
        name,
        price,
        stock,
        category:category.toLowerCase(),
        photo:photo?.path,
    });

    await invalidatesCache({product:true});
    
    res.status(201).json({
        success:true,
        message:"Product Created Successfully"
    })
    })

export const UpdateProduct = TryCatch(async(req,res,next)=>{

            const { id } = req.params
            const{name,price,stock,category} = req.body;
            const photo = req.file;
            const product = await Product.findById(id);

             if(!product) return next(new ErrorHandler("Invalid Product ID" , 404));

             if(photo){
                rm(product.photo! , () => {
                    console.log("Old Photo Deleted");
                })
                product.photo = photo.path;
            }

            if (name) product.name = name;
            if (price) product.price = price;
            if (stock) product.stock = stock;
            if (category) product.category = category;

            await product.save();

            await invalidatesCache({product:true, productId : String(product._id)});


    
    res.status(201).json({
        success:true,
        message:"Product Updated Successfully"
    })
})

export const DeleteProduct= TryCatch(async(
    req,res,next)=>{

            
            const product = await Product.findById(req.params.id);
            if(!product) return next(new ErrorHandler("Invalid Product Id" , 404));
            
            rm(product.photo! , () => {
                console.log("Product Photo Deleted");
            })

            await product.deleteOne()

            await invalidatesCache({product:true, productId : String(product._id)});
                    
            res.status(200).json({
                success:true, 
                message:"Product Deleted Successfully",
})
})

export const getAllProducts= TryCatch(async(
    req:Request<{},{},{}, SearchRequestQuery>,res,next)=>{
        
        
        const {search , sort , category , price} = req.query;

        const page = Number(req.query.page) || 1;

        const  limit = Number(process.env.PRODUCT_PER_PAGE) || 8;

        const skip = (page-1)*limit  

        const baseQuery : BaseQuery = {}

        if(search) baseQuery.name  = {
            $regex: search,
            $options: "i",
        }
        if(price) baseQuery.price = {
            $lte:Number(price)
        }
            
        if(category) baseQuery.category = category

        const ProductsPromise = 
        Product.find(baseQuery)
        .sort(sort && { price: sort === "asc"? 1 : -1})
        .limit(limit)
        .skip(skip)
    

        const [products , filteredOnlyProducts] = await Promise.all([
            ProductsPromise,
            Product.find(baseQuery),
        ])
            

        const totalPage = Math.ceil(filteredOnlyProducts.length / limit)
                     
        res.status(200).json({
            success:true,
            products,
            totalPage
})
    })


            

 

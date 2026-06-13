import React,{
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

import {
  getIsLoggedIn,
} from '../utils/auth';

import {
  Product,
  CartItem,
} from '../types';

import { toast } from 'sonner';

import custom_axios from '../axios/axios';

interface ShopContextType{
  cart:CartItem[];

  wishlist:any[];

  setWishlist:React.Dispatch<
    React.SetStateAction<any[]>
  >;

  addToCart:(
    product:Product,
    quantity?:number,
  )=>void;

  removeFromCart:(
    productId:string,
  )=>void;

  updateQuantity:(
    productId:string,
    quantity:number,
  )=>void;

  clearCart:()=>void;

  toggleWishlist:(
    product:any,
  )=>Promise<void>;

  isInWishlist:(
    productId:string,
  )=>boolean;

  cartTotal:number;

  cartCount:number;

  fetchWishlist:()=>Promise<void>;

  fetchCart:()=>Promise<void>;
}

const ShopContext=
createContext<
  ShopContextType|undefined
>(undefined);

export const ShopProvider=({
  children,
}:{
  children:ReactNode;
})=>{

  const [cart,setCart]=
  useState<CartItem[]>([]);

  const [wishlist,setWishlist]=
  useState<any[]>([]);

  const fetchCart=
  async()=>{

    try{

      const isLoggedIn =
      getIsLoggedIn();

      if(!isLoggedIn){

        setCart([]);

        return;
      }

      const response=
      await custom_axios.get(
        '/cart',
      );

      setCart(
        response.data.items||[],
      );

    }catch(error){

      console.log(error);
    }
  };

  useEffect(()=>{

    fetchCart();

  },[]);

  const fetchWishlist=
  async()=>{

    try{

      const isLoggedIn =
      getIsLoggedIn();

      if(!isLoggedIn){

        setWishlist([]);

        return;
      }

      const response=
      await custom_axios.get(
        '/wishlist',
      );

      setWishlist(
        response.data,
      );

    }catch(error){

      console.log(error);
    }
  };

  useEffect(()=>{

    fetchWishlist();

  },[]);

  const addToCart=
  async(
    product:Product,
    quantity:number=1,
  )=>{

    const existing=
    cart.find(
      (item:any)=>
      item.product.id===product.id
    );

    if(existing){

      setCart((prev:any)=>
        prev.map((item:any)=>

          item.product.id===product.id
          ?{
            ...item,
            quantity:
            item.quantity+
            quantity,
          }
          :item
        )
      );

    }else{

      setCart((prev:any)=>[
        ...prev,
        {
          id:Date.now(),
          quantity,
          product,
        },
      ]);
    }

    toast.success(
      `${product.productName} added to cart`,
    );

    try{

      await custom_axios.post(

        '/cart/add',

        {
          productId:product.id,
          quantity,
        },
      );

    }catch(error){

      console.log(error);
    }
  };

  const removeFromCart=
  async(
    productId:string,
  )=>{

    setCart((prev)=>
      prev.filter(
        (item:any)=>
        item.id!=productId
      )
    );

    toast.error(
      'Removed from cart',
    );

    try{

      await custom_axios.delete(
        `/cart/item/${productId}`,
      );

    }catch(error){

      console.log(error);
    }
  };

  const updateQuantity=
  async(
    productId:string,
    quantity:number,
  )=>{

    if(quantity<1)return;

    setCart((prev)=>
      prev.map((item:any)=>

        item.id==productId
        ?{
          ...item,
          quantity,
        }
        :item
      )
    );

    try{

      await custom_axios.patch(

        `/cart/item/${productId}`,

        {
          quantity,
        },
      );

    }catch(error){

      console.log(error);
    }
  };

  const clearCart=
  async()=>{

    setCart([]);

    try{

      await custom_axios.delete(
        '/cart/clear',
      );

    }catch(error){

      console.log(error);
    }
  };

  const toggleWishlist=
  async(
    product:any,
  )=>{

    const exists=
    wishlist.find(
      (item:any)=>

      item.product?.id===product.id||

      item.id===product.id
    );

    if(exists){

      setWishlist((prev)=>

        prev.filter(
          (item:any)=>

          item.product?.id!==product.id&&

          item.id!==product.id
        )
      );

      toast.error(
        'Removed from wishlist',
      );

    }else{

      setWishlist((prev)=>[
        ...prev,
        {
          id:Date.now(),
          product,
        },
      ]);

      toast.success(
        `${product.productName} added to wishlist`,
      );
    }

    try{

      if(exists){

        await custom_axios.delete(
          `/wishlist/${product.id}`,
        );

      }else{

        await custom_axios.post(

          '/wishlist/add',

          {
            productId:product.id,
          },
        );
      }

    }catch(error){

      console.log(error);
    }
  };

  const isInWishlist=(
    productId:string,
  )=>{

    return wishlist.some(
      (item:any)=>

      item.product?.id===
      productId||

      item.id===productId,
    );
  };

  const cartTotal=
  cart.reduce(

    (total,item:any)=>

    total+
    item.product.price*
    item.quantity,

    0,
  );

  const cartCount=
  cart.reduce(

    (count,item)=>

    count+
    item.quantity,

    0,
  );

  return(

    <ShopContext.Provider
      value={{

        cart,

        wishlist,

        setWishlist,

        addToCart,

        removeFromCart,

        updateQuantity,

        clearCart,

        toggleWishlist,

        isInWishlist,

        cartTotal,

        cartCount,

        fetchWishlist,

        fetchCart,
      }}
    >

      {children}

    </ShopContext.Provider>
  );
};

export const useShop=()=>{

  const context=
  useContext(
    ShopContext,
  );

  if(
    context===undefined
  ){

    throw new Error(

      'useShop must be used within a ShopProvider',
    );
  }

  return context;
};
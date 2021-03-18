import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get(`products/${productId}`);

      let productAdd = response.data;

      const found = cart.find((element) => element.id === productId);

      if (!!found) {
        updateProductAmount({ productId, amount: found.amount + 1 });
      } else {
        const newCart = [
          ...cart,
          {
            id: productId,
            amount: 1,
            image: productAdd.image,
            price: productAdd.price,
            title: productAdd.title,
          },
        ];
        setCart(newCart);

        await localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify(newCart)
        );
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      setCart(cart.filter((cartDelete) => productId !== cartDelete.id));
      await localStorage.setItem(
        "@RocketShoes:cart",
        JSON.stringify(cart.filter((cartDelete) => productId !== cartDelete.id))
      );
    } catch {
      return toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const response = await api.get(`stock/${productId}`);
      if (amount > response.data.amount) {
        return toast.error("Quantidade solicitada fora de estoque");
      } else {
        const newAmount = cart.map((product) =>
          product.id === productId
            ? {
                ...product,
                amount,
              }
            : product
        );
        setCart(newAmount);
        await localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify(newAmount)
        );
      }
    } catch {
      return toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

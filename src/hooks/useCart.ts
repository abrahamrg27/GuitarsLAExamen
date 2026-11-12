
import { useState, useEffect, useMemo } from "react"

const MIN_ITEMS = 1;
const MAX_ITEMS = 5;
const CART_STORAGE_KEY = "cart";

const isCartItem = (value: unknown): value is CartItem => {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const item = value as Record<string, unknown>;
    return typeof item.id === "number"
        && typeof item.name === "string"
        && typeof item.image === "string"
        && typeof item.description === "string"
        && typeof item.price === "number"
        && Number.isFinite(item.price)
        && typeof item.quantity === "number"
        && Number.isInteger(item.quantity)
        && item.quantity >= MIN_ITEMS
        && item.quantity <= MAX_ITEMS;
};

const getInitialCart = (): CartItem[] => {
    try {
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (!storedCart) {
            return [];
        }

        const parsed: unknown = JSON.parse(storedCart);
        return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
    } catch (error) {
        console.error("Error al leer el carrito de localStorage:", error);
        return [];
    }
};

export const useCart = () => {
    const [cart, setCart] = useState<CartItem[]>(getInitialCart);

    useEffect(() => {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        } catch (error) {
            console.error("Error al guardar el carrito en localStorage:", error);
        }
    }, [cart]);

    function addToCart(item: Guitar) {
        setCart((currentCart) => {
            const existingItem = currentCart.find((guitar) => guitar.id === item.id);
            if (!existingItem) {
                return [...currentCart, { ...item, quantity: MIN_ITEMS }];
            }

            if (existingItem.quantity >= MAX_ITEMS) {
                return currentCart;
            }

            return currentCart.map((guitar) =>
                guitar.id === item.id
                    ? { ...guitar, quantity: guitar.quantity + 1 }
                    : guitar
            );
        });
    }

    function decreaseQuantity(id: number) {
        setCart((currentCart) => currentCart.map((item) => {
            if (item.id !== id || item.quantity <= MIN_ITEMS) {
                return item;
            }

            return { ...item, quantity: item.quantity - 1 };
        }));
    }

    function increaseQuantity(id: number) {
        setCart((currentCart) => currentCart.map((item) => {
            if (item.id !== id || item.quantity >= MAX_ITEMS) {
                return item;
            }

            return { ...item, quantity: item.quantity + 1 };
        }));
    }

    function removeFromCart(id: number) {
        setCart((currentCart) => currentCart.filter((guitar) => guitar.id !== id));
    }

    function clearCart() {
        setCart([]);
    }

    const isEmpty = useMemo(() => cart.length === 0, [cart]);
    const cartTotal = useMemo(
        () => cart.reduce((total, item) => total + item.quantity * item.price, 0),
        [cart]
    );

    return {
        cart,
        addToCart,
        decreaseQuantity,
        increaseQuantity,
        removeFromCart,
        clearCart,
        isEmpty,
        cartTotal

    }
}
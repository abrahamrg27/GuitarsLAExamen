import { useEffect, useState } from "react";
import Guitar from "./components/Guitar"
import GuitarForm from "./components/GuitarForm"
import Header from "./components/Header"
import { useCart } from "./hooks/useCart"

function App() {
    const { cart,
          addToCart,
           decreaseQuantity, 
           increaseQuantity,
            removeFromCart,
             clearCart,
              isEmpty,
               cartTotal } = useCart();
    const [data, setData] = useState<Guitar[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadGuitars = async () => {
            setLoading(true);
            setError("");
            try {
                const response = await fetch("/api/guitars");
                if (!response.ok) {
                    throw new Error("No se pudo cargar el catálogo.");
                }

                const body: unknown = await response.json();
                if (!Array.isArray(body)) {
                    throw new Error("El catálogo recibido no tiene un formato válido.");
                }

                const guitars = body as Array<Guitar & { price: number | string }>;
                setData(guitars.map((guitar) => ({ ...guitar, price: Number(guitar.price) })));
            } catch (requestError) {
                setError(requestError instanceof Error ? requestError.message : "Error de conexión con el servidor.");
            } finally {
                setLoading(false);
            }
        };

        void loadGuitars();
    }, []);

    const addCreatedGuitar = (guitar: Guitar) => {
        setData((current) => [...current, guitar]);
    };
// inferencia: predecir tipos de datos que ya se conoce sin definirlo
// types: es el tipo de dato que se va a utilizar 
            //   const [isActivity, setisActivity] = useState<Number>(30);





    return (
        <>
            <Header
                cart={cart}
                decreaseQuantity={decreaseQuantity}
                increaseQuantity={increaseQuantity}
                removeFromCart={removeFromCart}
                clearCart={clearCart}
                isEmpty={isEmpty}
                cartTotal={cartTotal}
            />




            <GuitarForm onCreated={addCreatedGuitar} />

            <main className="container-xl mt-5">
                <h2 className="text-center">Nuestra Colección</h2>

                <div className="row mt-5">
                    {loading && <p className="text-center">Cargando catálogo...</p>}
                    {error && (
                        <div className="alert alert-danger text-center" role="alert">
                            <p className="mb-2">{error}</p>
                            <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={() => window.location.reload()}
                            >
                                Reintentar
                            </button>
                        </div>
                    )}
                    {!loading && !error && data.length === 0 && (
                        <div className="alert alert-warning text-center" role="alert">
                            No se encontró ninguna guitarra en el catálogo.
                        </div>
                    )}
                    {data.map((guitar) => (

                        <Guitar
                            key={guitar.id}
                            guitar={guitar}
                            addToCart={addToCart}


                        />



                    ))}

                </div>
            </main>

            <footer className="bg-dark mt-5 py-5">
                <div className="container-xl">
                    <p className="text-white text-center fs-4 mt-4 m-md-0">GuitarLA - Todos los derechos Reservados</p>
                </div>
            </footer>
        </>
    )
}

export default App
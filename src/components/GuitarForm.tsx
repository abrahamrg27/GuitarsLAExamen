import { useState } from "react";
import type { FormEvent } from "react";

type GuitarFormProps = {
    onCreated: (guitar: Guitar) => void;
};

const initialForm: GuitarFormData = {
    name: "",
    image: "",
    description: "",
    price: Number.NaN,
};

export default function GuitarForm({ onCreated }: GuitarFormProps) {
    const [form, setForm] = useState(initialForm);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const updateField = (field: keyof GuitarFormData, value: string) => {
        setForm((current) => ({
            ...current,
            [field]: field === "price" ? Number(value) : value,
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");

        if (!form.name.trim() || !form.image.trim() || !form.description.trim()) {
            setError("Completa todos los campos.");
            return;
        }

        if (!Number.isFinite(form.price) || form.price < 0) {
            setError("El precio debe ser un número mayor o igual a 0.");
            return;
        }

        setSaving(true);
        try {
            const response = await fetch("/api/guitars", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, price: Number(form.price) }),
            });

            const body: unknown = await response.json();
            if (!response.ok || typeof body !== "object" || body === null || !("id" in body)) {
                throw new Error("No se pudo registrar la guitarra.");
            }

            const guitar = body as Guitar & { price: number | string };
            onCreated({ ...guitar, price: Number(guitar.price) });
            setForm(initialForm);
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Error de conexión con el servidor.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="container-xl mt-5">
            <h2 className="text-center">Registrar guitarra</h2>
            <form className="guitar-form row g-3 mx-auto" onSubmit={handleSubmit}>
                <div className="col-md-6">
                    <label className="form-label" htmlFor="guitar-name">Nombre o modelo</label>
                    <input id="guitar-name" className="form-control" value={form.name}
                        onChange={(event) => updateField("name", event.target.value)} />
                </div>
                <div className="col-md-6">
                    <label className="form-label" htmlFor="guitar-image">Imagen</label>
                    <input id="guitar-image" className="form-control" placeholder="guitarra_01"
                        value={form.image} onChange={(event) => updateField("image", event.target.value)} />
                </div>
                <div className="col-md-4">
                    <label className="form-label" htmlFor="guitar-price">Precio</label>
                    <input id="guitar-price" className="form-control" type="number" min="0" step="0.01"
                        value={Number.isNaN(form.price) ? "" : form.price}
                        onChange={(event) => updateField("price", event.target.value)} />
                </div>
                <div className="col-12">
                    <label className="form-label" htmlFor="guitar-description">Descripción</label>
                    <textarea id="guitar-description" className="form-control" rows={3} value={form.description}
                        onChange={(event) => updateField("description", event.target.value)} />
                </div>
                {error && <p className="text-danger mb-0" role="alert">{error}</p>}
                <div className="col-12">
                    <button className="btn btn-dark" type="submit" disabled={saving}>
                        {saving ? "Guardando..." : "Registrar guitarra"}
                    </button>
                </div>
            </form>
        </section>
    );
}

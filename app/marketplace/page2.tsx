"use client";

import { useEffect, useState } from "react";
import { getProducts, Product } from "@/services/productService";
import styles from "./marketplace.module.css";

export default function Marketplace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((err) => setFetchError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className={styles.container}>
      <h1>Marketplace</h1>
      <p className={styles.header}>Fresh farm produce directly from farmers.</p>
      {loading && <p>Loading products...</p>}
      {fetchError && <p className={styles.error}>Error: {fetchError}</p>}
      <div className={styles.grid}>
        {products.map((product) => (
          <div key={product._id} className={styles.card}>
            <h3>{product.name}</h3>
            <p className={styles.price}>₦{product.price}</p>
            <p>{product.quantity} units</p>
            <p>{product.location}</p>
            <button className={styles.button}>Buy</button>
          </div>
        ))}
        {!loading && products.length === 0 && !fetchError && (
          <p>No products listed yet.</p>
        )}
      </div>
    </main>
  );
}

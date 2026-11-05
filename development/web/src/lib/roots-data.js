// Utility functions for fetching and managing restaurant/dish data
const API_BASE = '/api';

export async function fetchCatalog() {
  try {
    const response = await fetch(`${API_BASE}/roots/catalog`);
    if (!response.ok) throw new Error('Failed to fetch catalog');
    return await response.json();
  } catch (err) {
    console.error('Error fetching catalog:', err);
    return { settings: {}, restaurants: [] };
  }
}

export async function fetchMenu() {
  try {
    const response = await fetch(`${API_BASE}/menu`);
    if (!response.ok) throw new Error('Failed to fetch menu');
    return await response.json();
  } catch (err) {
    console.error('Error fetching menu:', err);
    return { dishes: [], restaurants: [] };
  }
}

export async function submitOrder(orderData) {
  try {
    const response = await fetch(`${API_BASE}/roots/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!response.ok) throw new Error('Failed to submit order');
    return await response.json();
  } catch (err) {
    throw new Error(err.message || 'Error submitting order');
  }
}

export function filterDishes(dishes, filters) {
  let result = dishes;

  if (filters.query) {
    const q = filters.query.toLowerCase();
    result = result.filter((d) =>
      d.name?.toLowerCase().includes(q) ||
      d.nameTa?.toLowerCase().includes(q) ||
      d.cuisine?.toLowerCase().includes(q)
    );
  }

  if (filters.cuisine) {
    result = result.filter((d) => d.cuisine === filters.cuisine);
  }

  if (filters.restaurant) {
    result = result.filter((d) => d.restId === filters.restaurant);
  }

  if (filters.healthy) {
    result = result.filter((d) => d.tags?.includes('Healthy'));
  }

  if (filters.topRated) {
    result = result.filter((d) => d.rating >= 4.6);
  }

  return result;
}

export function sortDishes(dishes, sortBy) {
  const sorted = [...dishes];
  switch (sortBy) {
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating);
    case 'popular':
      return sorted.sort((a, b) => b.orders - a.orders);
    case 'newest':
      return sorted.sort((a, b) => b.id.localeCompare(a.id));
    default:
      return sorted;
  }
}

export function calculateOrderTotal(cartLines, dishes, deliveryFees) {
  let subtotal = 0;
  const restaurantIds = new Set();

  cartLines.forEach((line) => {
    const dish = dishes.find((d) => d.id === line.dishId);
    if (dish) {
      subtotal += (dish.priceInr || 0) * line.qty;
      restaurantIds.add(line.restId);
    }
  });

  let deliveryTotal = 0;
  restaurantIds.forEach((restId) => {
    const fee = deliveryFees[restId] || 0;
    deliveryTotal += fee;
  });

  const total = subtotal + deliveryTotal;
  return { subtotal, deliveryTotal, total, restaurantCount: restaurantIds.size };
}

export function getRestaurantStats(restaurants) {
  return {
    totalRestaurants: restaurants.length,
    openRestaurants: restaurants.filter((r) => r.open).length,
    avgRating: (restaurants.reduce((sum, r) => sum + (r.rating || 0), 0) / restaurants.length).toFixed(1),
  };
}

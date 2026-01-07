'use client';

import { ProductSchema, Product, ProductFormData, Holiday, HolidayFormData, HolidaySchema, User, Milestone, CustomUrl } from './types';
import { INITIAL_PRODUCTS } from './initial-products';

const parseDateFromStorage = (dateString: string | null | undefined): Date | undefined => {
  if (!dateString) return undefined;
  return new Date(dateString);
};

// Helper functions for LocalStorage
const getFromStorage = <T>(key: string, parseDate: boolean = false): T[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(key);
  if (!data) return [];
  try {
    const parsedData = JSON.parse(data);

    if (parseDate && Array.isArray(parsedData)) {
       return parsedData.map((item: any) => {
          const newItem = { ...item };
          if (item.date) newItem.date = parseDateFromStorage(item.date);
          if (item.startDate) newItem.startDate = parseDateFromStorage(item.startDate);
          if (item.endDate) newItem.endDate = parseDateFromStorage(item.endDate);
           if (item.milestones) {
              newItem.milestones = item.milestones.map((m: any) => ({
                  ...m,
                  startDate: parseDateFromStorage(m.startDate),
                  endDate: parseDateFromStorage(m.endDate),
              }));
          }
          if (item.createdAt) newItem.createdAt = parseDateFromStorage(item.createdAt);
          if (item.updatedAt) newItem.updatedAt = parseDateFromStorage(item.updatedAt);
          return newItem;
      });
    }

    return parsedData;
  } catch(e) {
    console.error("Failed to parse from storage", e);
    return [];
  }
}

const saveToStorage = (key: string, data: any[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
  window.dispatchEvent(new Event('storage'));
};

export const getProductsFromStorage = (): Product[] => {
    if (typeof window === 'undefined') return [];
    
    let products = getFromStorage<Product>('products', true);

    if (products.length === 0) {
        console.log('No products found in localStorage, loading initial data.');
        const initialProducts = INITIAL_PRODUCTS as any[];
        saveToStorage('products', initialProducts);
        products = getFromStorage<Product>('products', true);
    }
    
    return products;
};

const saveProductsToStorage = (products: Product[]) => {
    saveToStorage('products', products);
};

export async function createOrUpdateProduct(
  formData: ProductFormData,
  user: User,
  productId?: string
): Promise<{ success: boolean; message: string }> {

  const validatedFields = ProductSchema.safeParse(formData);

  if (!validatedFields.success) {
    console.error(validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      message: 'Error de validación. Por favor, revise los campos.',
    };
  }
  
  const { milestones, customUrls, ...productData } = validatedFields.data;

  try {
    let products = getProductsFromStorage();
    const now = new Date();

    if (productId) {
      // Update
      products = products.map(p => {
        if (p.id === productId) {
          const updatedMilestones: Milestone[] = milestones?.map(m => ({
            id: m.id || crypto.randomUUID(),
            name: m.name,
            startDate: m.startDate,
            endDate: m.endDate,
            status: m.status,
            productId: productId,
          })) || [];

          const updatedCustomUrls: CustomUrl[] = customUrls?.map(u => ({
            id: u.id || crypto.randomUUID(),
            label: u.label,
            url: u.url,
          })) || [];

          return {
            ...p,
            ...productData,
            // Convertir undefined a null para campos opcionales
            productiveUrl: productData.productiveUrl || null,
            vercelDemoUrl: productData.vercelDemoUrl || null,
            wpContentProdUrl: productData.wpContentProdUrl || null,
            wpContentTestUrl: productData.wpContentTestUrl || null,
            chatbotUrl: productData.chatbotUrl || null,
            comments: productData.comments || null,
            milestones: updatedMilestones,
            customUrls: updatedCustomUrls,
            updatedBy: user,
            updatedAt: now,
          };
        }
        return p;
      });
    } else {
      // Create
      const newProductId = crypto.randomUUID();
      
      const newMilestones: Milestone[] = milestones?.map(m => ({
        id: crypto.randomUUID(),
        name: m.name,
        startDate: m.startDate,
        endDate: m.endDate,
        status: m.status,
        productId: newProductId,
      })) || [];

      const newCustomUrls: CustomUrl[] = customUrls?.map(u => ({
        id: crypto.randomUUID(),
        label: u.label,
        url: u.url,
      })) || [];

      const newProduct: Product = {
        id: newProductId,
        ...productData,
        // Convertir undefined a null para campos opcionales
        productiveUrl: productData.productiveUrl || null,
        vercelDemoUrl: productData.vercelDemoUrl || null,
        wpContentProdUrl: productData.wpContentProdUrl || null,
        wpContentTestUrl: productData.wpContentTestUrl || null,
        chatbotUrl: productData.chatbotUrl || null,
        comments: productData.comments || null,
        milestones: newMilestones,
        customUrls: newCustomUrls,
        createdBy: user,
        createdAt: now,
        updatedBy: null,
        updatedAt: null,
      };
      products.push(newProduct);
    }

    saveProductsToStorage(products);
    
    return {
      success: true,
      message: `Producto ${productId ? 'actualizado' : 'creado'} con éxito.`,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: 'Ocurrió un error en el servidor.',
    };
  }
}

export async function deleteProduct(productId: string): Promise<{ success: boolean; message: string }> {
    if (!productId) {
        return { success: false, message: "ID de producto no proporcionado."};
    }
    try {
        let products = getProductsFromStorage();
        products = products.filter(p => p.id !== productId);
        saveProductsToStorage(products);
        return { success: true, message: "Producto eliminado con éxito." };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Error al eliminar el producto."};
    }
}

// Holiday Actions

export const getHolidaysFromStorage = (): Holiday[] => {
    return getFromStorage<Holiday>('holidays', true);
}

export const saveHolidaysToStorage = (holidays: Holiday[]) => {
    saveToStorage('holidays', holidays);
};

export async function createOrUpdateHoliday(
  formData: HolidayFormData,
  holidayId?: string
): Promise<{ success: boolean; message: string }> {

  const validatedFields = HolidaySchema.safeParse(formData);

  if (!validatedFields.success) {
    console.error(validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      message: 'Error de validación. Por favor, revise los campos.',
    };
  }

  try {
    let holidays = getHolidaysFromStorage();
    if (holidayId) {
      holidays = holidays.map(h => h.id === holidayId ? { ...validatedFields.data, id: holidayId } : h);
    } else {
      const newHoliday: Holiday = {
        id: crypto.randomUUID(),
        ...validatedFields.data,
      };
      holidays.push(newHoliday);
    }
    saveHolidaysToStorage(holidays);
    return {
      success: true,
      message: `Feriado ${holidayId ? 'actualizado' : 'creado'} con éxito.`,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: 'Ocurrió un error en el servidor.',
    };
  }
}

export async function deleteHoliday(holidayId: string): Promise<{ success: boolean; message: string }> {
    if (!holidayId) {
        return { success: false, message: "ID de feriado no proporcionado."};
    }
    try {
        let holidays = getHolidaysFromStorage();
        holidays = holidays.filter(h => h.id !== holidayId);
        saveHolidaysToStorage(holidays);
        return { success: true, message: "Feriado eliminado con éxito." };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Error al eliminar el feriado."};
    }
}
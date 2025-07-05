import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
// Importamos solo 'db' desde nuestro archivo de configuración central
import { db } from '../../firebaseConfig'; 

// --- COLECCIONES DE FIRESTORE ---
const tasksCollection = collection(db, 'tasks');
const projectsCollection = collection(db, 'projects'); // Nueva colección para proyectos

// --- FUNCIONES PARA TAREAS (EXISTENTES) ---

export const createTask = async (taskData) => {
  try {
    await addDoc(tasksCollection, {
      ...taskData,
      completed: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error creating task: ", error);
  }
};

export const updateTask = async (taskId, updates) => {
  const taskDoc = doc(db, 'tasks', taskId);
  try {
    await updateDoc(taskDoc, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error)
 {
    console.error("Error updating task: ", error);
  }
};

export const deleteTask = async (taskId) => {
  const taskDoc = doc(db, 'tasks', taskId);
  try {
    await deleteDoc(taskDoc);
  } catch (error) {
    console.error("Error deleting task: ", error);
  }
};

export const subscribeToUserTasks = (userId, callback) => {
  const q = query(
    tasksCollection, 
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const tasks = [];
    querySnapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() });
    });
    callback(tasks);
  });

  return unsubscribe;
};


// --- FUNCIONES PARA PROYECTOS (NUEVAS) ---

/**
 * Crea un nuevo proyecto en Firestore.
 * @param {object} projectData - Datos del proyecto (ej: { name, userId })
 */
export const createProject = async (projectData) => {
  try {
    await addDoc(projectsCollection, {
      ...projectData,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error creating project: ", error);
  }
};

/**
 * Se suscribe a los proyectos de un usuario para obtener actualizaciones en tiempo real.
 * @param {string} userId - El ID del usuario.
 * @param {function} callback - Función que se ejecuta con la lista de proyectos.
 * @returns {function} - Función para cancelar la suscripción.
 */
export const subscribeToUserProjects = (userId, callback) => {
  const q = query(
    projectsCollection, 
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const projects = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(projects);
  });

  return unsubscribe;
};
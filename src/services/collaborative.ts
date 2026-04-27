import { db } from './firebase';
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import type { ContentType, LearningUnit } from '../data/mishnah-structure';

export interface GroupProgress {
  [globalPosition: string]: {
    completedBy: string;
    completedAt: number;
  };
}

export interface LearningGroup {
  id: string;
  name: string;
  contentType: ContentType;
  unit: LearningUnit;
  masechetIds: string[];
  totalUnits: number;
  progress: GroupProgress;
}

export async function createLearningGroup(
  groupName: string, 
  contentType: ContentType, 
  unit: LearningUnit, 
  masechetIds: string[], 
  totalUnits: number
): Promise<string> {
  const groupId = Math.random().toString(36).substring(2, 9);
  const groupRef = doc(db, 'groups', groupId);
  
  await setDoc(groupRef, {
    id: groupId,
    name: groupName,
    contentType,
    unit,
    masechetIds,
    totalUnits,
    progress: {}
  });

  return groupId;
}

export async function getLearningGroup(groupId: string): Promise<LearningGroup | null> {
  const groupRef = doc(db, 'groups', groupId);
  const docSnap = await getDoc(groupRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as LearningGroup;
  }
  return null;
}

export async function markGroupUnitComplete(groupId: string, globalPosition: number, userName: string = 'אנונימי') {
  const groupRef = doc(db, 'groups', groupId);
  
  await setDoc(groupRef, {
    progress: {
      [globalPosition.toString()]: {
        completedBy: userName,
        completedAt: Date.now()
      }
    }
  }, { merge: true });
}

export function listenToGroupProgress(groupId: string, callback: (progress: GroupProgress) => void) {
  const groupRef = doc(db, 'groups', groupId);
  return onSnapshot(groupRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data() as LearningGroup;
      callback(data.progress || {});
    }
  });
}

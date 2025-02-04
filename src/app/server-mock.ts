import fs from 'fs';
import path from 'path';

// Mock server-side data storage utility
export class DataStorageService {
  private static STORAGE_DIR = path.join(process.cwd(), 'study-data');

  // Ensure storage directory exists
  static initializeStorage() {
    if (!fs.existsSync(this.STORAGE_DIR)) {
      fs.mkdirSync(this.STORAGE_DIR, { recursive: true });
    }
  }

  // Save study data as JSON file
  static saveStudyData(userId: string, data: any) {
    this.initializeStorage();
    
    const filename = `${userId}-study-data.json`;
    const filepath = path.join(this.STORAGE_DIR, filename);

    try {
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving study data:', error);
      return false;
    }
  }

  // Retrieve study data
  static getStudyData(userId: string) {
    const filename = `${userId}-study-data.json`;
    const filepath = path.join(this.STORAGE_DIR, filename);

    try {
      if (fs.existsSync(filepath)) {
        const rawData = fs.readFileSync(filepath, 'utf8');
        return JSON.parse(rawData);
      }
      return null;
    } catch (error) {
      console.error('Error reading study data:', error);
      return null;
    }
  }
}

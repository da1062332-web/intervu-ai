export interface StyleCharacteristic {
  name: string;
  value: unknown;
}

export interface StyleProfile {
  id: string;
  name: string;
  description?: string | null;
  profileType: "campus" | "lateral" | "executive" | "certification";
  characteristics: StyleCharacteristic[];
  active: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CreateStyleProfile {
  name: string;
  description?: string | null;
  profileType: "campus" | "lateral" | "executive" | "certification";
  characteristics: StyleCharacteristic[];
  active?: boolean;
}

export interface UpdateStyleProfile {
  name?: string;
  description?: string | null;
  profileType?: "campus" | "lateral" | "executive" | "certification";
  characteristics?: StyleCharacteristic[];
  active?: boolean;
}

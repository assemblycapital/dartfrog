import { create } from 'zustand'

export interface RadioStore {
  // 
  get: () => RadioStore 
  set: (partial: RadioStore | Partial<RadioStore>) => void
}

const useRadioStore = create<RadioStore>((set, get) => ({
  // 
  get,
  set,
}))

export default useRadioStore;

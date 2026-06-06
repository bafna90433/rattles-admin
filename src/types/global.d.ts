export {};

declare global {
  interface Window {
    electronAPI: {
      loginUser: (data: { username: string; password: string; role: string }) => Promise<any>;
      saveCombination?: (data: any) => Promise<any>;
      getCombinations?: () => Promise<any>;
      deleteCombination?: (id: number) => Promise<any>;
      // tu chahe to aur handlers yahan add kar sakta hai later
    };
  }
}

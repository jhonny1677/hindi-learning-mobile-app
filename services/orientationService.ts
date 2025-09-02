import React from 'react';
import { Dimensions } from 'react-native';

interface OrientationState {
  width: number;
  height: number;
  isPortrait: boolean;
  isLandscape: boolean;
  orientation: 'portrait' | 'landscape';
}

class OrientationService {
  private listeners: ((state: OrientationState) => void)[] = [];
  private currentState: OrientationState;
  
  constructor() {
    const { width, height } = Dimensions.get('window');
    this.currentState = this.calculateState(width, height);
    this.setupListeners();
  }
  
  private calculateState(width: number, height: number): OrientationState {
    const isPortrait = height > width;
    return {
      width,
      height,
      isPortrait,
      isLandscape: !isPortrait,
      orientation: isPortrait ? 'portrait' : 'landscape',
    };
  }
  
  private setupListeners() {
    // Listen to dimension changes
    const dimensionListener = Dimensions.addEventListener('change', ({ window }) => {
      const newState = this.calculateState(window.width, window.height);
      
      if (newState.orientation !== this.currentState.orientation) {
        this.currentState = newState;
        this.notifyListeners(newState);
      }
    });
  }
  
  private notifyListeners(state: OrientationState) {
    this.listeners.forEach(listener => listener(state));
  }
  
  public getOrientation(): OrientationState {
    return { ...this.currentState };
  }
  
  public addListener(callback: (state: OrientationState) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  public async lockToPortrait(): Promise<void> {
    console.log('Orientation lock not available on this platform');
  }
  
  public async lockToLandscape(): Promise<void> {
    console.log('Orientation lock not available on this platform');
  }
  
  public async unlockOrientation(): Promise<void> {
    console.log('Orientation unlock not available on this platform');
  }
  
  public isTabletSize(): boolean {
    const { width, height } = this.currentState;
    const minDimension = Math.min(width, height);
    const maxDimension = Math.max(width, height);
    
    // Consider it a tablet if minimum dimension is > 600 and aspect ratio is not too extreme
    return minDimension > 600 && (maxDimension / minDimension) < 2;
  }
  
  public getLayoutPreset(): 'mobile-portrait' | 'mobile-landscape' | 'tablet-portrait' | 'tablet-landscape' {
    const isTablet = this.isTabletSize();
    const isPortrait = this.currentState.isPortrait;
    
    if (isTablet) {
      return isPortrait ? 'tablet-portrait' : 'tablet-landscape';
    } else {
      return isPortrait ? 'mobile-portrait' : 'mobile-landscape';
    }
  }
  
  // Responsive breakpoints
  public getBreakpoint(): 'xs' | 'sm' | 'md' | 'lg' | 'xl' {
    const width = this.currentState.width;
    
    if (width < 480) return 'xs';
    if (width < 768) return 'sm';
    if (width < 1024) return 'md';
    if (width < 1280) return 'lg';
    return 'xl';
  }
}

export const orientationService = new OrientationService();

// React hook for using orientation in components
export const useOrientation = () => {
  const [orientation, setOrientation] = React.useState(orientationService.getOrientation());
  
  React.useEffect(() => {
    const unsubscribe = orientationService.addListener(setOrientation);
    return unsubscribe;
  }, []);
  
  return orientation;
};

// Higher-order component for orientation-aware components
export const withOrientation = <P extends object>(
  Component: React.ComponentType<P & { orientation: OrientationState }>
) => {
  const OrientationAwareComponent = (props: P) => {
    const orientation = useOrientation();
    return React.createElement(Component, { ...props, orientation });
  };
  
  OrientationAwareComponent.displayName = `withOrientation(${Component.displayName || Component.name})`;
  return OrientationAwareComponent;
};
declare module '@react-navigation/native' {
  import { ComponentType, ReactNode } from 'react';
  
  export interface NavigationContainerProps {
    children: ReactNode;
    [key: string]: any;
  }
  
  export const NavigationContainer: ComponentType<NavigationContainerProps>;
}

declare module '@react-navigation/bottom-tabs' {
  import { ComponentType, ReactNode } from 'react';
  
  export interface BottomTabNavigatorProps {
    children: ReactNode;
    [key: string]: any;
  }
  
  export interface ScreenProps {
    name: string;
    component: ComponentType<any>;
    options?: any;
    [key: string]: any;
  }
  
  export interface TabNavigator {
    Navigator: ComponentType<BottomTabNavigatorProps>;
    Screen: ComponentType<ScreenProps>;
  }
  
  export function createBottomTabNavigator(): TabNavigator;
}

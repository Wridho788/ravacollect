// This entry point is bundled only by the Android e2e build type.
import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import { TestApp } from './e2e/TestApp';
AppRegistry.registerComponent(appName, () => TestApp);

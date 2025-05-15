import { registerRootComponent } from 'expo';

import App from './App';

// Η registerRootComponent καλεί την AppRegistry.registerComponent('main', () => App);
// Επίσης, διασφαλίζει ότι είτε φορτώνετε την εφαρμογή στο Expo Go είτε σε μια native build,
// το περιβάλλον έχει ρυθμιστεί κατάλληλα
registerRootComponent(App);

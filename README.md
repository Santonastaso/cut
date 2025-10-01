# OptiCUT Pro - Advanced Material Cutting Optimization System

A comprehensive React application for optimizing material cutting operations, specifically designed for industrial use with coil/roll materials.

## Features

### 🎯 Multi-Algorithm Optimization
- **Bidimensional Combination**: Standard 2D optimization considering both width and length
- **Waste Minimization (ILP)**: Integer Linear Programming to minimize material waste
- **Priority Orders (ILP)**: Prioritizes high-priority orders even at cost of more waste
- **Roll Minimization (ILP)**: Uses minimum number of rolls possible
- **Multi-objective (ILP)**: Balances multiple optimization goals with configurable weights
- **Column Generation (ILP)**: Advanced algorithm for large-scale problems

### 📊 Advanced Analytics
- Real-time algorithm comparison
- Visual pattern representation
- Progress tracking for each order
- Comprehensive statistics and metrics

### 🎨 Modern UI/UX
- Clean, responsive design
- Interactive visualizations
- Tabbed results view
- Loading states and progress indicators

### 🔧 Data Management
- Material catalog management
- Stock roll inventory
- Cut request management with priorities
- JSON export/import functionality

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **React Query** - Server state management
- **React Router** - Client-side routing
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons
- **Sonner** - Toast notifications

## Project Structure

```
src/
├── algorithms/           # Optimization algorithms
│   ├── baseAlgorithm.js
│   ├── bidimensionalAlgorithm.js
│   ├── wasteMinimizationAlgorithm.js
│   ├── priorityAlgorithm.js
│   ├── rollMinimizationAlgorithm.js
│   ├── multiObjectiveAlgorithm.js
│   ├── columnGenerationAlgorithm.js
│   └── index.js
├── components/
│   ├── ui/              # Reusable UI components
│   ├── layout/          # Layout components
│   └── visualization/   # Cutting pattern visualizations
├── pages/               # Main application pages
├── store/               # Zustand stores
├── utils/               # Utility functions
└── lib/                 # Library utilities
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cut
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

### 1. Define Materials
- Add materials with codes, names, and specific weights (g/m²)
- Materials are used to calculate roll weights and optimization parameters

### 2. Manage Stock Rolls
- Add available rolls with dimensions (width/length), weights, and batch numbers
- Rolls are automatically grouped by material for optimization

### 3. Create Cut Requests
- Define customer orders with priority levels and quantities
- Requests include material, dimensions, and priority (high/normal/low)

### 4. Optimize Cutting Plans
- Select from 6 different optimization algorithms
- Configure algorithm-specific settings
- View real-time optimization results and comparisons

### 5. Analyze Results
- Review cutting patterns with visual representations
- Compare different algorithms side-by-side
- Export optimization results as JSON

## Algorithm Details

### Bidimensional Algorithm
Standard optimization that considers both width and length dimensions, using a first-fit decreasing approach.

### Waste Minimization Algorithm
Focuses on minimizing material waste using a best-fit approach to reduce leftover material.

### Priority Algorithm
Prioritizes high-priority orders, ensuring they are fulfilled first even if it results in more waste.

### Roll Minimization Algorithm
Aims to use the minimum number of rolls by grouping similar widths and maximizing roll utilization.

### Multi-objective Algorithm
Balances multiple optimization goals (waste, priority, roll usage) with configurable weights.

### Column Generation Algorithm
Advanced algorithm for large-scale problems using iterative pattern generation and optimization.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by industrial cutting optimization problems
- Built with modern React patterns and best practices
- Uses accessible UI components from Radix UI


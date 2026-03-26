import React, { lazy, Suspense } from 'react';
import {
  Box,
  Typography,
  Divider,
  Chip,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Skeleton,
  Paper,
  Stack,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import { motion } from 'framer-motion';
import useStore from '../../store/useStore';
import speciesData from '../../data/species.json';

// Lazy-load 3D viewer for performance
const Viewer3D = lazy(() => import('../Viewer3D/Viewer3D'));

function formatYear(year) {
  if (year === 0) return 'Present';
  const abs = Math.abs(year);
  if (abs >= 1000000) return `${(abs / 1000000).toFixed(1)} Mya`;
  if (abs >= 1000) return `${(abs / 1000).toFixed(0)} kya`;
  return `${abs} ya`;
}

/**
 * Shows a column of species data for comparison.
 */
function SpeciesColumn({ species, slotIndex, onClear }) {
  if (!species) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          border: '2px dashed',
          borderColor: 'divider',
          borderRadius: 3,
          p: 3,
          color: 'text.disabled',
        }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          Select a species
        </Typography>
        <Typography variant="caption">Use the dropdown below to choose</Typography>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{ flex: 1 }}
    >
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: `${species.color}44`,
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: '#0d0d1a',
        }}
      >
        {/* Species header */}
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            bgcolor: `${species.color}18`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            borderBottom: '1px solid',
            borderColor: `${species.color}33`,
          }}
        >
          <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: species.color, flexShrink: 0 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {species.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {formatYear(species.start)} – {formatYear(species.end)}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => onClear(slotIndex)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* 3D Viewer */}
        <Box sx={{ p: 1.5 }}>
          <Suspense
            fallback={
              <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2, bgcolor: '#1a1a2e' }} />
            }
          >
            <Viewer3D color={species.color} height={220} smithsonianScan={species.smithsonianScan} sketchfabId={species.sketchfabId} />
          </Suspense>
        </Box>

        {/* Details */}
        <Box sx={{ px: 2.5, pb: 2.5 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, mb: 2, fontSize: '0.8rem' }}>
            {species.description.slice(0, 200)}…
          </Typography>

          <Divider sx={{ mb: 1.5 }}>
            <Typography variant="overline" sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>
              Traits
            </Typography>
          </Divider>

          {[
            ['Brain Size', species.traits.brainSize],
            ['Height', species.traits.height],
            ['Diet', species.traits.diet],
            ['Tools', species.traits.tools],
            ['Region', species.region],
          ].map(([label, value]) => (
            <Box
              key={label}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 2,
                py: 0.75,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0 }}>
                {label}
              </Typography>
              <Typography variant="caption" sx={{ textAlign: 'right' }}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    </motion.div>
  );
}

/**
 * Comparison mode: side-by-side species comparison with 3D viewers.
 */
export default function Comparison() {
  const { comparisonSpecies, setComparisonSlot, clearComparison } = useStore();

  const handleSelect = (slotIndex, id) => {
    const species = speciesData.find((s) => s.id === id) || null;
    setComparisonSlot(slotIndex, species);
  };

  const handleClear = (slotIndex) => {
    setComparisonSlot(slotIndex, null);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Species Comparison
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Select two species to compare their traits side by side.
          </Typography>
        </Box>
        <Button
          size="small"
          variant="outlined"
          sx={{ ml: 'auto' }}
          onClick={clearComparison}
        >
          Clear All
        </Button>
      </Box>

      {/* Species selectors */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[0, 1].map((slotIndex) => (
          <Grid item xs={12} sm={6} key={slotIndex}>
            <FormControl fullWidth size="small">
              <InputLabel>{`Species ${slotIndex + 1}`}</InputLabel>
              <Select
                value={comparisonSpecies[slotIndex]?.id || ''}
                label={`Species ${slotIndex + 1}`}
                onChange={(e) => handleSelect(slotIndex, e.target.value)}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {speciesData.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color, flexShrink: 0 }} />
                      {s.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        ))}
      </Grid>

      {/* Side-by-side comparison columns */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
        <SpeciesColumn
          species={comparisonSpecies[0]}
          slotIndex={0}
          onClear={handleClear}
        />
        <SpeciesColumn
          species={comparisonSpecies[1]}
          slotIndex={1}
          onClear={handleClear}
        />
      </Box>
    </Box>
  );
}

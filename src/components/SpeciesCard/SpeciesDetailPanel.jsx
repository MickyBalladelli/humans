import React, { lazy, Suspense } from 'react';
import {
  Box,
  Drawer,
  Typography,
  Divider,
  Chip,
  Grid,
  IconButton,
  Skeleton,
  Button,
  Tooltip,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/useStore';

// Lazy-load the heavy 3D viewer so the drawer doesn't block rendering
const Viewer3D = lazy(() => import('../Viewer3D/Viewer3D'));

const DRAWER_WIDTH = 480;

/** Displays a single trait row with label and value */
function TraitRow({ label, value }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        py: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        gap: 2,
      }}
    >
      <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0, pt: 0.25 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ textAlign: 'right' }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function SpeciesDetailPanel() {
  const {
    selectedSpecies,
    detailOpen,
    setDetailOpen,
    setComparisonSlot,
    comparisonSpecies,
    setActiveView,
  } = useStore();

  const species = selectedSpecies;

  const handleClose = () => setDetailOpen(false);

  const handleAddToComparison = () => {
    // Find an empty slot, prefer slot 0 then slot 1
    const emptySlot = comparisonSpecies.findIndex((s) => s === null);
    const slot = emptySlot === -1 ? 0 : emptySlot;
    setComparisonSlot(slot, species);
    setActiveView('comparison');
    setDetailOpen(false);
  };

  return (
    <Drawer
      anchor="right"
      open={detailOpen}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: { xs: '100vw', sm: DRAWER_WIDTH },
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          borderLeft: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <AnimatePresence mode="wait">
        {species && (
          <motion.div
            key={species.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.3 }}
            style={{ height: '100%', overflow: 'auto' }}
          >
            {/* Header */}
            <Box
              sx={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                bgcolor: 'background.paper',
                borderBottom: '1px solid',
                borderColor: 'divider',
                px: 2.5,
                py: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: species.color,
                  flexShrink: 0,
                }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" noWrap>
                  {species.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {formatYear(species.start)} – {formatYear(species.end)}
                </Typography>
              </Box>
              <Stack direction="row" gap={0.5}>
                <Tooltip title="Add to Comparison">
                  <IconButton size="small" onClick={handleAddToComparison}>
                    <CompareArrowsIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Close">
                  <IconButton size="small" onClick={handleClose}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>

            <Box sx={{ px: 2.5, pt: 2, pb: 4 }}>
              {/* Image */}
              <Box
                component="img"
                src={species.image}
                alt={species.name}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
                sx={{
                  width: '100%',
                  maxHeight: 220,
                  objectFit: 'cover',
                  borderRadius: 2,
                  mb: 2,
                  bgcolor: '#1a1a2e',
                }}
              />

              {/* Region and era chips */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={species.region}
                  size="small"
                  sx={{ bgcolor: `${species.color}22`, color: species.color, border: `1px solid ${species.color}44` }}
                />
                <Chip
                  label={`${formatYear(species.start)} – ${formatYear(species.end)}`}
                  size="small"
                  variant="outlined"
                />
              </Box>

              {/* Description */}
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7, mb: 3 }}>
                {species.description}
              </Typography>

              <Divider sx={{ mb: 2 }}>
                <Typography variant="overline" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
                  Key Traits
                </Typography>
              </Divider>

              {/* Traits */}
              <Box sx={{ mb: 3 }}>
                <TraitRow label="Brain Size" value={species.traits.brainSize} />
                <TraitRow label="Height" value={species.traits.height} />
                <TraitRow label="Diet" value={species.traits.diet} />
                <TraitRow label="Tools & Technology" value={species.traits.tools} />
              </Box>

              {/* Related species */}
              {(species.ancestors.length > 0 || species.descendants.length > 0) && (
                <>
                  <Divider sx={{ mb: 2 }}>
                    <Typography variant="overline" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
                      Related Species
                    </Typography>
                  </Divider>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                    {species.ancestors.map((id) => (
                      <Chip key={id} label={`↑ ${formatId(id)}`} size="small" variant="outlined" />
                    ))}
                    {species.descendants.map((id) => (
                      <Chip key={id} label={`↓ ${formatId(id)}`} size="small" variant="outlined" />
                    ))}
                  </Box>
                </>
              )}

              {/* 3D Viewer section */}
              <Divider sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ViewInArIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                  <Typography variant="overline" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
                    3D Fossil Model
                  </Typography>
                </Box>
              </Divider>

              <Suspense
                fallback={
                  <Skeleton
                    variant="rectangular"
                    height={300}
                    sx={{ borderRadius: 2, bgcolor: '#1a1a2e' }}
                  />
                }
              >
                <Viewer3D color={species.color} height={300} smithsonianScan={species.smithsonianScan} sketchfabId={species.sketchfabId} cameraYaw={species.sketchfabCameraYaw ?? null} />
              </Suspense>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<CompareArrowsIcon />}
                onClick={handleAddToComparison}
                sx={{ mt: 2 }}
              >
                Compare with Another Species
              </Button>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Drawer>
  );
}

function formatYear(year) {
  if (year === 0) return 'Present';
  const abs = Math.abs(year);
  if (abs >= 1000000) return `${(abs / 1000000).toFixed(1)} Mya`;
  if (abs >= 1000) return `${(abs / 1000).toFixed(0)} kya`;
  return `${abs} ya`;
}

function formatId(id) {
  return id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

import React, { lazy, Suspense, useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Tabs,
  Tab,
  InputBase,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Skeleton,
  Tooltip,
  alpha,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import TimelineIcon from '@mui/icons-material/Timeline';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import CloseIcon from '@mui/icons-material/Close';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import speciesData from '../data/species.json';

// Lazy-load heavy components
const Timeline = lazy(() => import('../components/Timeline/Timeline'));
const SpeciesDetailPanel = lazy(() => import('../components/SpeciesCard/SpeciesDetailPanel'));
const Comparison = lazy(() => import('../components/Comparison/Comparison'));
const Viewer3D = lazy(() => import('../components/Viewer3D/Viewer3D'));

const VIEWS = [
  { value: 'timeline', label: 'Timeline', icon: <TimelineIcon fontSize="small" /> },
  { value: 'comparison', label: 'Compare', icon: <CompareArrowsIcon fontSize="small" /> },
  { value: '3d', label: '3D Viewer', icon: <ViewInArIcon fontSize="small" /> },
];

/**
 * Full-screen loading skeleton placeholder
 */
function ViewSkeleton() {
  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2, bgcolor: '#1a1a2e' }} />
      <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, bgcolor: '#1a1a2e' }} />
      <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2, bgcolor: '#1a1a2e' }} />
    </Box>
  );
}

/**
 * The standalone 3D viewer page with species selector
 */
function ViewerPage() {
  const [selectedId, setSelectedId] = useState('homo-sapiens');
  const species = speciesData.find((s) => s.id === selectedId);

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        3D Fossil Explorer
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Explore 3D models of fossil skulls. Drag to rotate, scroll to zoom.
      </Typography>

      {/* Species tabs */}
      <Tabs
        value={selectedId}
        onChange={(_, val) => setSelectedId(val)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        {speciesData.map((s) => (
          <Tab
            key={s.id}
            value={s.id}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color, flexShrink: 0 }} />
                {s.shortName}
              </Box>
            }
          />
        ))}
      </Tabs>

      {species && (
        <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', lg: 'nowrap' } }}>
          {/* 3D viewer */}
          <Box sx={{ flex: '0 0 auto', width: { xs: '100%', lg: 520 } }}>
            <Suspense
              fallback={<Skeleton variant="rectangular" height={480} sx={{ borderRadius: 2, bgcolor: '#1a1a2e' }} />}
            >
              <Viewer3D color={species.color} height={480} smithsonianScan={species.smithsonianScan} sketchfabId={species.sketchfabId} />
            </Suspense>
          </Box>

          {/* Species info */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: species.color }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {species.name}
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.7, mb: 3 }}>
              {species.description}
            </Typography>
            <Box>
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
                    py: 1.25,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {label}
                  </Typography>
                  <Typography variant="body2" sx={{ textAlign: 'right' }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default function Home() {
  const { activeView, setActiveView, searchQuery, setSearchQuery } = useStore();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top App Bar */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundImage: 'none',
        }}
      >
        <Toolbar sx={{ gap: 1.5 }}>
          {/* Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3CB371 0%, #4682B4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              🦴
            </Box>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1, letterSpacing: '-0.3px' }}>
                Human Evolution Explorer
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1 }}>
                7 million years of human prehistory
              </Typography>
            </Box>
          </Box>

          {/* Navigation Tabs (desktop) */}
          <Tabs
            value={activeView}
            onChange={(_, v) => setActiveView(v)}
            sx={{ ml: 3, display: { xs: 'none', md: 'flex' } }}
            TabIndicatorProps={{ style: { height: 3, borderRadius: 2 } }}
          >
            {VIEWS.map(({ value, label, icon }) => (
              <Tab
                key={value}
                value={value}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    {icon}
                    {label}
                  </Box>
                }
              />
            ))}
          </Tabs>

          <Box sx={{ flex: 1 }} />

          {/* Search */}
          <AnimatePresence>
            {searchOpen && activeView === 'timeline' ? (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 220, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: 'hidden' }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: alpha('#fff', 0.08),
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.5,
                    gap: 1,
                  }}
                >
                  <SearchIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <InputBase
                    autoFocus
                    placeholder="Search species…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ fontSize: '0.85rem', flex: 1 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              </motion.div>
            ) : (
              activeView === 'timeline' && (
                <Tooltip title="Search species">
                  <IconButton size="small" onClick={() => setSearchOpen(true)}>
                    <SearchIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )
            )}
          </AnimatePresence>

          {/* Mobile menu button */}
          <IconButton
            size="small"
            sx={{ display: { md: 'none' } }}
            onClick={() => setMobileDrawerOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile navigation drawer */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        PaperProps={{ sx: { width: 240 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Navigation
          </Typography>
          <List disablePadding>
            {VIEWS.map(({ value, label, icon }) => (
              <ListItem key={value} disablePadding>
                <ListItemButton
                  selected={activeView === value}
                  onClick={() => {
                    setActiveView(value);
                    setMobileDrawerOpen(false);
                  }}
                  sx={{ borderRadius: 2, mb: 0.5 }}
                >
                  <Box sx={{ mr: 1.5, display: 'flex' }}>{icon}</Box>
                  <ListItemText primary={label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            style={{ height: '100%' }}
          >
            <Suspense fallback={<ViewSkeleton />}>
              {activeView === 'timeline' && <Timeline />}
              {activeView === 'comparison' && <Comparison />}
              {activeView === '3d' && <ViewerPage />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* Species Detail Panel (global drawer, rendered once) */}
      <Suspense fallback={null}>
        <SpeciesDetailPanel />
      </Suspense>
    </Box>
  );
}

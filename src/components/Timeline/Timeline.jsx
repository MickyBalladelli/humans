import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Box, Typography, Tooltip, IconButton, Chip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import useStore from '../../store/useStore';
import allSpeciesData from '../../data/species.json';

// Timeline spans from 7 Mya to present (0)
const TIMELINE_START = -7000000; // 7 million years ago
const TIMELINE_END = 0;
const TIMELINE_RANGE = Math.abs(TIMELINE_START);

// Convert a year value (negative = BCE) to a percentage position on the timeline
const yearToPercent = (year) => (year - TIMELINE_START) / TIMELINE_RANGE;

// Format large year numbers into readable labels
const formatYear = (year) => {
  if (year === 0) return 'Present';
  const abs = Math.abs(year);
  if (abs >= 1000000) return `${(abs / 1000000).toFixed(1)} Mya`;
  if (abs >= 1000) return `${(abs / 1000).toFixed(0)} kya`;
  return `${abs} ya`;
};

// Tick marks along the bottom axis
const TICKS = [
  -7000000, -6000000, -5000000, -4000000, -3000000,
  -2000000, -1000000, -500000, -200000, -100000, -40000, 0,
];

export default function Timeline() {
  const { setSelectedSpecies, setDetailOpen, searchQuery } = useStore();
  const scrollRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [hoveredId, setHoveredId] = useState(null);

  // Use the imported species data (static JSON)
  const allSpecies = allSpeciesData;

  const filteredSpecies = React.useMemo(() => {
    if (!searchQuery) return allSpecies;
    const q = searchQuery.toLowerCase();
    return allSpecies.filter(
      (s) => s.name.toLowerCase().includes(q) || s.shortName.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Anchor zoom to current viewport centre so the view doesn't jump to the left edge
  const pendingAnchor = useRef(null);
  const captureAnchor = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth, scrollWidth } = scrollRef.current;
    pendingAnchor.current = (scrollLeft + clientWidth / 2) / scrollWidth;
  };
  const handleZoomIn  = () => { captureAnchor(); setZoom((z) => Math.min(z + 0.4, 4)); };
  const handleZoomOut = () => { captureAnchor(); setZoom((z) => Math.max(z - 0.4, 0.6)); };
  const handleReset   = () => { setZoom(1); if (scrollRef.current) scrollRef.current.scrollLeft = 0; };

  useEffect(() => {
    const frac = pendingAnchor.current;
    if (frac == null || !scrollRef.current) return;
    pendingAnchor.current = null;
    const { scrollWidth, clientWidth } = scrollRef.current;
    scrollRef.current.scrollLeft = frac * scrollWidth - clientWidth / 2;
  }, [zoom]);

  // Pointer drag-to-pan
  const dragState = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });

  const handlePointerDown = useCallback((e) => {
    if (!scrollRef.current) return;
    dragState.current = {
      active: true,
      startX: e.clientX,
      scrollLeft: scrollRef.current.scrollLeft,
      moved: false,
    };
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!dragState.current.active) return;
    const dx = e.clientX - dragState.current.startX;
    if (Math.abs(dx) > 4) {
      dragState.current.moved = true;
      scrollRef.current.scrollLeft = dragState.current.scrollLeft - dx;
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    dragState.current.active = false;
  }, []);

  // Suppress click-on-bar events that are actually the end of a drag
  const handleClickCapture = useCallback((e) => {
    if (dragState.current.moved) {
      dragState.current.moved = false;
      e.stopPropagation();
    }
  }, []);

  const handleSelect = useCallback(
    (species) => {
      setSelectedSpecies(species);
      setDetailOpen(true);
    },
    [setSelectedSpecies, setDetailOpen]
  );

  const rows = React.useMemo(() => {
    const sorted = [...allSpecies].sort((a, b) => a.start - b.start);
    const rowEnds = [];
    return sorted.map((sp) => {
      let row = rowEnds.findIndex((end) => end <= sp.start + 200000);
      if (row === -1) {
        row = rowEnds.length;
        rowEnds.push(sp.end);
      } else {
        rowEnds[row] = sp.end;
      }
      return { ...sp, row };
    });
  }, []);

  const maxRow = Math.max(...rows.map((r) => r.row));
  const ROW_HEIGHT = 72;
  const timelineHeight = (maxRow + 1) * ROW_HEIGHT + 140;
  const timelineWidth = `${100 * zoom}%`;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Zoom controls */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>
          7 Million Years of Human Evolution
        </Typography>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
          <Tooltip title="Zoom In">
            <IconButton size="small" onClick={handleZoomIn}>
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton size="small" onClick={handleZoomOut}>
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset Zoom">
            <IconButton size="small" onClick={handleReset}>
              <RestartAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Scrollable timeline canvas */}
      <Box
        ref={scrollRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClickCapture={handleClickCapture}
        sx={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'auto',
          position: 'relative',
          bgcolor: 'background.default',
          cursor: 'grab',
          '&:active': { cursor: 'grabbing' },
          // Keep scrollbar always visible so users know they can scroll
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.2) transparent',
          '&::-webkit-scrollbar': { height: 6 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 3 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: timelineWidth,
            minWidth: 900,
            height: timelineHeight,
            px: 4,
          }}
        >
          {/* Central timeline axis */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 36,
              left: '4%',
              right: '4%',
              height: 2,
              bgcolor: 'divider',
            }}
          />

          {/* Axis tick marks & labels */}
          {TICKS.map((tick) => {
            const pct = yearToPercent(tick) * 92 + 4; // map to 4%–96%
            return (
              <Box
                key={tick}
                sx={{
                  position: 'absolute',
                  bottom: 20,
                  left: `${pct}%`,
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <Box sx={{ width: 1, height: 12, bgcolor: 'text.disabled', mb: 0.5 }} />
                <Typography
                  variant="caption"
                  sx={{ color: 'text.disabled', fontSize: '0.6rem', whiteSpace: 'nowrap' }}
                >
                  {formatYear(tick)}
                </Typography>
              </Box>
            );
          })}

          {/* Species bars */}
          <AnimatePresence>
            {rows.map((species) => {
              const leftPct = yearToPercent(species.start) * 92 + 4;
              const rightPct = yearToPercent(species.end) * 92 + 4;
              const widthPct = rightPct - leftPct;
              const bottomOffset = 60 + species.row * ROW_HEIGHT;
              const isFiltered =
                searchQuery &&
                !filteredSpecies.find((f) => f.id === species.id);

              return (
                <motion.div
                  key={species.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: isFiltered ? 0.2 : 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, delay: rows.indexOf(species) * 0.05 }}
                  style={{
                    position: 'absolute',
                    bottom: bottomOffset,
                    left: `${leftPct}%`,
                    width: `${Math.max(widthPct, 0.5)}%`,
                  }}
                >
                  <Tooltip
                    title={
                      <Box>
                        <Typography variant="subtitle2">{species.name}</Typography>
                        <Typography variant="caption">
                          {formatYear(species.start)} – {formatYear(species.end)}
                        </Typography>
                      </Box>
                    }
                    placement="top"
                    arrow
                  >
                    <Box
                      onClick={() => handleSelect(species)}
                      onMouseEnter={() => setHoveredId(species.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      sx={{
                        height: 28,
                        borderRadius: 2,
                        bgcolor: species.color,
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        boxShadow:
                          hoveredId === species.id
                            ? `0 0 0 3px ${species.color}88, 0 4px 20px ${species.color}66`
                            : '0 2px 8px rgba(0,0,0,0.4)',
                        transform: hoveredId === species.id ? 'scaleY(1.3)' : 'scaleY(1)',
                        transformOrigin: 'center',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          borderRadius: 2,
                          background:
                            'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.1) 100%)',
                        },
                      }}
                    />
                  </Tooltip>

                  {/* Species label (shown when bar is wide enough) */}
                  {widthPct > 2 && (
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        fontSize: '0.65rem',
                        color: hoveredId === species.id ? species.color : 'text.secondary',
                        transition: 'color 0.2s',
                        fontWeight: hoveredId === species.id ? 700 : 400,
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {species.shortName}
                    </Typography>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* "Present" marker */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 44,
              right: '4%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Chip
              label="Now"
              size="small"
              sx={{
                bgcolor: '#3CB371',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.6rem',
                height: 18,
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Legend */}
      <Box
        sx={{
          px: 3,
          py: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          Click a bar to view details · Drag to pan · Scroll to zoom
        </Typography>
        {allSpecies.map((s) => (
          <Box
            key={s.id}
            onClick={() => handleSelect(s)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              cursor: 'pointer',
              opacity: 0.8,
              '&:hover': { opacity: 1 },
            }}
          >
            <Box
              sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color, flexShrink: 0 }}
            />
            <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>
              {s.shortName}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

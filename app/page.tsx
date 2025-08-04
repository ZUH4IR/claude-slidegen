'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Tab,
  Tabs,
  AppBar,
  Toolbar,
  Typography,
} from '@mui/material'
import GeneratorTab from '@/components/GeneratorTab'
import PromptsTab from '@/components/PromptsTab'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function Home() {
  const [tabValue, setTabValue] = useState(0)

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Claude SlideGen
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="xl" sx={{ mt: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="main tabs">
            <Tab label="Generator" />
            <Tab label="Prompt Editor" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <GeneratorTab />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <PromptsTab />
        </TabPanel>
      </Container>
    </>
  )
}
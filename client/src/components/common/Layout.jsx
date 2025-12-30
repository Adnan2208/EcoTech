import { Outlet, useLocation } from 'react-router-dom';
import { Box, Container, Typography, Grid, Link as MuiLink, Divider, IconButton, alpha } from '@mui/material';
import { Link } from 'react-router-dom';
import { Recycling, GitHub, Twitter, LinkedIn, Email, Favorite } from '@mui/icons-material';
import Navbar from '@/components/common/Navbar';

const Footer = () => {
  const footerLinks = {
    Platform: [
      { label: 'Explore Map', path: '/' },
      { label: 'Report Issue', path: '/report' },
      { label: 'My Reports', path: '/my-reports' },
    ],
    Resources: [
      { label: 'How It Works', path: '#' },
      { label: 'FAQ', path: '#' },
      { label: 'Community Guidelines', path: '#' },
    ],
    Legal: [
      { label: 'Privacy Policy', path: '#' },
      { label: 'Terms of Service', path: '#' },
      { label: 'Cookie Policy', path: '#' },
    ],
  };

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'grey.900',
        color: 'grey.300',
        pt: 8,
        pb: 4,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Brand Section */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Recycling sx={{ color: 'white', fontSize: 26 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 800 }}>
                  EcoWatch
                </Typography>
                <Typography variant="caption" sx={{ color: 'grey.500' }}>
                  Community Waste Platform
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ mb: 3, maxWidth: 300, lineHeight: 1.7 }}>
              Empowering communities to report and resolve waste issues together. 
              Join thousands of citizens making our cities cleaner.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[GitHub, Twitter, LinkedIn].map((Icon, index) => (
                <IconButton
                  key={index}
                  size="small"
                  sx={{
                    color: 'grey.500',
                    bgcolor: alpha('#fff', 0.05),
                    '&:hover': {
                      color: 'primary.main',
                      bgcolor: alpha('#059669', 0.1),
                    },
                  }}
                >
                  <Icon fontSize="small" />
                </IconButton>
              ))}
            </Box>
          </Grid>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <Grid item xs={6} sm={4} md={2} key={title}>
              <Typography
                variant="subtitle2"
                sx={{ color: 'white', fontWeight: 600, mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}
              >
                {title}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {links.map((link) => (
                  <MuiLink
                    key={link.label}
                    component={Link}
                    to={link.path}
                    sx={{
                      color: 'grey.400',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      transition: 'color 0.2s',
                      '&:hover': { color: 'primary.main' },
                    }}
                  >
                    {link.label}
                  </MuiLink>
                ))}
              </Box>
            </Grid>
          ))}

          {/* Newsletter Section */}
          <Grid item xs={12} md={2}>
            <Typography
              variant="subtitle2"
              sx={{ color: 'white', fontWeight: 600, mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}
            >
              Contact
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'grey.400' }}>
              <Email fontSize="small" />
              <Typography variant="body2">support@ecowatch.app</Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: 'grey.800' }} />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ color: 'grey.500' }}>
            © {new Date().getFullYear()} EcoWatch. All rights reserved.
          </Typography>
          <Typography variant="body2" sx={{ color: 'grey.500', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            Made with <Favorite sx={{ fontSize: 14, color: 'error.main' }} /> for a cleaner planet
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

const Layout = () => {
  const location = useLocation();
  const isMapPage = location.pathname === '/';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </Box>
      {/* Only show footer on non-map pages to avoid layout issues */}
      {!isMapPage && <Footer />}
    </Box>
  );
};

export default Layout;

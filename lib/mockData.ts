export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  description: string;
  masterCount: number;
  startingPrice: number;
  popular?: boolean;
  badge?: string;
  bgGradient: string;
}

export interface MasterProfile {
  id: string;
  name: string;
  title: string;
  category: string;
  categoryId: string;
  avatar: string;
  coverImage: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  hourlyRate: number;
  location: string;
  distance: string;
  verified: boolean;
  topRated: boolean;
  bio: string;
  experienceYears: number;
  skills: string[];
  certificates: Array<{ title: string; issuer: string; year: string }>;
  workingHours: { [key: string]: string };
  gallery: string[];
  reviews: Review[];
}

export interface Review {
  id: string;
  clientName: string;
  clientAvatar: string;
  rating: number;
  date: string;
  serviceTitle: string;
  comment: string;
  photos?: string[];
  craftsmanReply?: string;
}

export interface Booking {
  id: string;
  bookingCode: string;
  serviceName: string;
  categoryName: string;
  categoryId: string;
  masterId: string;
  masterName: string;
  masterAvatar: string;
  masterPhone: string;
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  status: 'Pending' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';
  totalPrice: number;
  paymentStatus: 'Paid' | 'Pending' | 'Refunded';
  notes: string;
  timeline: Array<{ stage: string; timestamp: string; completed: boolean }>;
}

export const CATEGORIES: ServiceCategory[] = [
  {
    id: 'plumber',
    name: 'Plumbing Services',
    slug: 'plumbing',
    iconName: 'Wrench',
    description: 'Pipe repair, leak detection, drain cleaning, tap & fixture installations.',
    masterCount: 142,
    startingPrice: 35,
    popular: true,
    badge: 'High Demand',
    bgGradient: 'from-blue-500/10 to-cyan-500/10',
  },
  {
    id: 'electrician',
    name: 'Electrical Work',
    slug: 'electrical',
    iconName: 'Zap',
    description: 'Wiring, circuit breakers, light fixtures, switchboards & safety audits.',
    masterCount: 188,
    startingPrice: 40,
    popular: true,
    badge: 'Popular',
    bgGradient: 'from-amber-500/10 to-yellow-500/10',
  },
  {
    id: 'ac-repair',
    name: 'AC Repair & HVAC',
    slug: 'ac-repair',
    iconName: 'Wind',
    description: 'Freon refill, compressor fixing, duct cleaning, annual AC servicing.',
    masterCount: 96,
    startingPrice: 45,
    popular: true,
    badge: 'Top Rated',
    bgGradient: 'from-sky-500/10 to-blue-500/10',
  },
  {
    id: 'painter',
    name: 'Interior & Exterior Painting',
    slug: 'painting',
    iconName: 'Paintbrush',
    description: 'Wall painting, wallpaper installation, texture coating & waterproofing.',
    masterCount: 115,
    startingPrice: 30,
    popular: false,
    bgGradient: 'from-purple-500/10 to-indigo-500/10',
  },
  {
    id: 'carpenter',
    name: 'Carpentry & Woodwork',
    slug: 'carpentry',
    iconName: 'Hammer',
    description: 'Custom furniture, door fittings, wooden flooring & cabinet repairs.',
    masterCount: 84,
    startingPrice: 38,
    popular: true,
    bgGradient: 'from-emerald-500/10 to-teal-500/10',
  },
  {
    id: 'cleaner',
    name: 'Deep Cleaning',
    slug: 'cleaning',
    iconName: 'Sparkles',
    description: 'Full house deep cleaning, sofa shampooing, carpet & kitchen sanitization.',
    masterCount: 210,
    startingPrice: 25,
    popular: true,
    badge: 'Best Value',
    bgGradient: 'from-teal-500/10 to-emerald-500/10',
  },
  {
    id: 'appliance-repair',
    name: 'Appliance Repair',
    slug: 'appliance-repair',
    iconName: 'Tv',
    description: 'Washing machine, refrigerator, microwave oven & dishwasher servicing.',
    masterCount: 78,
    startingPrice: 35,
    popular: false,
    bgGradient: 'from-rose-500/10 to-pink-500/10',
  },
  {
    id: 'mason',
    name: 'Masonry & Tiling',
    slug: 'masonry',
    iconName: 'Grid',
    description: 'Tile replacement, brickwork, marble polishing & concrete repairs.',
    masterCount: 62,
    startingPrice: 42,
    popular: false,
    bgGradient: 'from-orange-500/10 to-amber-500/10',
  },
  {
    id: 'welder',
    name: 'Welding & Metalwork',
    slug: 'welding',
    iconName: 'Flame',
    description: 'Gate repair, metal railing fabrication, structural steel welding.',
    masterCount: 45,
    startingPrice: 50,
    popular: false,
    bgGradient: 'from-red-500/10 to-orange-500/10',
  },
  {
    id: 'roofer',
    name: 'Roofing Services',
    slug: 'roofing',
    iconName: 'Home',
    description: 'Roof leak waterproofing, tile replacement, gutter repair & insulation.',
    masterCount: 39,
    startingPrice: 55,
    popular: false,
    bgGradient: 'from-slate-500/10 to-zinc-500/10',
  },
  {
    id: 'interior-designer',
    name: 'Interior Design',
    slug: 'interior-design',
    iconName: 'Compass',
    description: '3D space planning, color consultation, modular kitchen design.',
    masterCount: 54,
    startingPrice: 75,
    popular: true,
    badge: 'Luxury',
    bgGradient: 'from-violet-500/10 to-purple-500/10',
  },
  {
    id: 'cctv-installer',
    name: 'CCTV & Security Systems',
    slug: 'cctv-installer',
    iconName: 'ShieldCheck',
    description: 'IP camera setup, smart lock installation, alarm & DVR setup.',
    masterCount: 88,
    startingPrice: 40,
    popular: true,
    badge: 'Smart Home',
    bgGradient: 'from-cyan-500/10 to-blue-500/10',
  },
  {
    id: 'internet-tech',
    name: 'Internet & Networking',
    slug: 'networking',
    iconName: 'Wifi',
    description: 'Mesh Wi-Fi setup, fiber optic cabling, office network configuration.',
    masterCount: 67,
    startingPrice: 30,
    popular: false,
    bgGradient: 'from-blue-500/10 to-indigo-500/10',
  },
  {
    id: 'locksmith',
    name: 'Locksmith Services',
    slug: 'locksmith',
    iconName: 'Key',
    description: 'Emergency door opening, deadbolt installation, key duplicating.',
    masterCount: 93,
    startingPrice: 35,
    popular: false,
    bgGradient: 'from-amber-500/10 to-orange-500/10',
  },
  {
    id: 'handyman',
    name: 'General Handyman',
    slug: 'handyman',
    iconName: 'Tool',
    description: 'TV wall mounting, curtain hanging, shelf installation & odd jobs.',
    masterCount: 240,
    startingPrice: 20,
    popular: true,
    badge: 'Fast Booking',
    bgGradient: 'from-emerald-500/10 to-cyan-500/10',
  },
];

export const MASTERS: MasterProfile[] = [
  {
    id: 'master-1',
    name: 'Alex Morgan',
    title: 'Senior Master Electrician & Smart Home Specialist',
    category: 'Electrical Work',
    categoryId: 'electrician',
    avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80',
    rating: 4.95,
    reviewCount: 312,
    completedJobs: 480,
    hourlyRate: 45,
    location: 'Central Downtown, NY',
    distance: '1.8 miles away',
    verified: true,
    topRated: true,
    bio: 'Licensed master electrician with over 12 years of hands-on experience in residential rewiring, smart breaker panel upgrades, EV charger installations, and emergency troubleshooting. Guaranteed safety and zero compliance issues.',
    experienceYears: 12,
    skills: ['EV Charger Install', 'Breaker Panel Upgrade', 'Smart Lighting (Lutron)', 'Emergency Troubleshooting', 'Safety Inspection'],
    certificates: [
      { title: 'Master Electrician License (Class A)', issuer: 'State Electrical Board', year: '2016' },
      { title: 'Tesla Certified EV Installer', issuer: 'Tesla Motors', year: '2021' },
      { title: 'OSHA 30 Safety Certification', issuer: 'OSHA', year: '2019' },
    ],
    workingHours: {
      'Monday - Friday': '08:00 AM - 07:00 PM',
      'Saturday': '09:00 AM - 05:00 PM',
      'Sunday': 'Emergency Calls Only',
    },
    gallery: [
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    ],
    reviews: [
      {
        id: 'rev-1',
        clientName: 'David K. Vance',
        clientAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        date: '2 days ago',
        serviceTitle: 'Whole Home Smart Panel Installation',
        comment: 'Alex is an absolute wizard! Upgraded our old 100A panel to a 200A smart panel and installed our Tesla Gen 3 charger seamlessly. Kept everything spotless and explained every detail.',
        craftsmanReply: 'Thanks David! It was a pleasure working on your home electrical setup.',
      },
      {
        id: 'rev-2',
        clientName: 'Emily Stone',
        clientAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        date: '1 week ago',
        serviceTitle: 'Recessed LED Lighting Installation',
        comment: 'Super punctual, professional, and friendly. Installed 12 recessed lights in our living room with zero drywall damage. Highly recommended!',
      },
    ],
  },
  {
    id: 'master-2',
    name: 'Marcus Vance',
    title: 'Master Plumber & Hydro-Jetting Expert',
    category: 'Plumbing Services',
    categoryId: 'plumber',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
    rating: 4.92,
    reviewCount: 245,
    completedJobs: 390,
    hourlyRate: 50,
    location: 'Westside, NY',
    distance: '3.2 miles away',
    verified: true,
    topRated: true,
    bio: 'Specialist in trenchless pipe repair, tankless water heater installations, luxury bathroom plumbing fixtures, and high-pressure sewer drain jetting.',
    experienceYears: 15,
    skills: ['Tankless Water Heaters', 'Hydro-Jetting', 'Bathroom Fixture Fitting', 'Sewer Camera Inspection', 'Leak Detection'],
    certificates: [
      { title: 'Licensed Master Plumber #4829', issuer: 'NYC Plumbing Association', year: '2012' },
      { title: 'Rinnai Certified Tankless Technician', issuer: 'Rinnai USA', year: '2018' },
    ],
    workingHours: {
      'Monday - Saturday': '07:00 AM - 08:00 PM',
      'Sunday': '24/7 Emergency Service',
    },
    gallery: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80',
    ],
    reviews: [
      {
        id: 'rev-3',
        clientName: 'Michael Chang',
        clientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        date: '3 days ago',
        serviceTitle: 'Emergency Pipe Burst Repair',
        comment: 'Arrived within 30 minutes of my emergency call at midnight! Fixed the leaking main line quickly and saved our basement floors.',
      },
    ],
  },
  {
    id: 'master-3',
    name: 'Sarah Jenkins',
    title: 'Award-Winning Interior Architect & Designer',
    category: 'Interior Design',
    categoryId: 'interior-designer',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    rating: 4.98,
    reviewCount: 189,
    completedJobs: 215,
    hourlyRate: 85,
    location: 'Manhattan, NY',
    distance: '2.4 miles away',
    verified: true,
    topRated: true,
    bio: 'Transforming luxury apartments and urban villas with Scandinavian minimalism and Japandi elegance. 3D photorealistic renderings, custom lighting plans, and full furniture curation.',
    experienceYears: 10,
    skills: ['3D Photorealistic Rendering', 'Modular Kitchen Layout', 'Custom Furniture Design', 'Color Palette Curation', 'Lighting Design'],
    certificates: [
      { title: 'NCIDQ Certified Interior Designer', issuer: 'NCIDQ Council', year: '2017' },
      { title: 'LEED AP ID+C', issuer: 'US Green Building Council', year: '2019' },
    ],
    workingHours: {
      'Monday - Friday': '09:00 AM - 06:00 PM',
      'Saturday': 'By Appointment',
      'Sunday': 'Closed',
    },
    gallery: [
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80',
    ],
    reviews: [
      {
        id: 'rev-4',
        clientName: 'Victoria Sterling',
        clientAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        date: '5 days ago',
        serviceTitle: 'Full Loft Redesign & Curation',
        comment: 'Sarah elevated our penthouse into a work of art. The attention to natural light, wood textures, and ambient glow is unmatched.',
      },
    ],
  },
  {
    id: 'master-4',
    name: 'Robert Miller',
    title: 'HVAC Specialist & Climate Automation Specialist',
    category: 'AC Repair & HVAC',
    categoryId: 'ac-repair',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80',
    rating: 4.88,
    reviewCount: 164,
    completedJobs: 290,
    hourlyRate: 48,
    location: 'Brooklyn, NY',
    distance: '4.1 miles away',
    verified: true,
    topRated: false,
    bio: 'EPA 608 Universal certified technician specializing in multi-zone VRF systems, Nest/Ecobee smart thermostat integration, and ductwork air quality purification.',
    experienceYears: 11,
    skills: ['Daikin VRF Systems', 'Freon Leak Repair', 'Smart Thermostat Integration', 'Ductless Mini-Split', 'Air Purification Filters'],
    certificates: [
      { title: 'EPA Section 608 Universal Certification', issuer: 'US EPA', year: '2014' },
      { title: 'NATE Certified HVAC Technician', issuer: 'NATE', year: '2017' },
    ],
    workingHours: {
      'Monday - Saturday': '08:00 AM - 07:00 PM',
      'Sunday': '10:00 AM - 04:00 PM',
    },
    gallery: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    ],
    reviews: [],
  },
  {
    id: 'master-5',
    name: 'Elena Rostova',
    title: 'Master Decorative Painter & Wall Artist',
    category: 'Interior & Exterior Painting',
    categoryId: 'painter',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1200&q=80',
    rating: 4.96,
    reviewCount: 210,
    completedJobs: 330,
    hourlyRate: 40,
    location: 'Queens, NY',
    distance: '3.8 miles away',
    verified: true,
    topRated: true,
    bio: 'Specializing in Venetian plaster finishes, limewash aesthetics, crisp modern accent walls, and zero-VOC eco-friendly paints for healthy home environments.',
    experienceYears: 9,
    skills: ['Venetian Plaster', 'Limewash Finish', 'Exterior Waterproof Painting', 'Cabinet Spray Painting', 'Wallpaper Hanging'],
    certificates: [
      { title: 'Certified Venetian Plaster Specialist', issuer: 'Italian Stucco Guild', year: '2018' },
    ],
    workingHours: {
      'Monday - Friday': '08:00 AM - 06:00 PM',
      'Saturday': '09:00 AM - 04:00 PM',
    },
    gallery: [
      'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80',
    ],
    reviews: [],
  },
  {
    id: 'master-6',
    name: 'David Chen',
    title: 'Smart Home Security & CCTV Systems Engineer',
    category: 'CCTV & Security Systems',
    categoryId: 'cctv-installer',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=1200&q=80',
    rating: 4.91,
    reviewCount: 142,
    completedJobs: 210,
    hourlyRate: 55,
    location: 'Manhattan, NY',
    distance: '1.2 miles away',
    verified: true,
    topRated: true,
    bio: 'Designing unbreachable perimeter security for estates and residences. 4K PoE camera arrays, night-vision AI detection, encrypted NVR storage & remote mobile control setup.',
    experienceYears: 8,
    skills: ['Hikvision 4K PoE Arrays', 'Ring & Nest Integration', 'Biometric Smart Door Locks', 'Intrusion Alarm Systems', 'Network Security'],
    certificates: [
      { title: 'Certified Security Systems Manager', issuer: 'ASIS International', year: '2019' },
    ],
    workingHours: {
      'Monday - Saturday': '08:00 AM - 08:00 PM',
    },
    gallery: [],
    reviews: [],
  },
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'b-101',
    bookingCode: 'UG-84920',
    serviceName: '200A Smart Electrical Panel Upgrade',
    categoryName: 'Electrical Work',
    categoryId: 'electrician',
    masterId: 'master-1',
    masterName: 'Alex Morgan',
    masterAvatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80',
    masterPhone: '+1 (555) 234-8901',
    scheduledDate: 'Tomorrow, Oct 14',
    scheduledTime: '10:00 AM - 12:00 PM',
    address: '742 Evergreen Terrace, Apt 4B, New York, NY',
    status: 'In Progress',
    totalPrice: 280,
    paymentStatus: 'Paid',
    notes: 'Please call on arrival. Dog is friendly but will be kept in master bedroom.',
    timeline: [
      { stage: 'Booking Request Placed', timestamp: 'Oct 12, 02:30 PM', completed: true },
      { stage: 'Craftsman Confirmed', timestamp: 'Oct 12, 02:45 PM', completed: true },
      { stage: 'Master En Route to Address', timestamp: 'Oct 14, 09:35 AM', completed: true },
      { stage: 'Work in Progress', timestamp: 'Oct 14, 10:05 AM', completed: true },
      { stage: 'Job Completed & Verified', timestamp: 'Estimated 11:45 AM', completed: false },
    ],
  },
  {
    id: 'b-102',
    bookingCode: 'UG-73911',
    serviceName: 'Living Room Deep Limewash Wall Painting',
    categoryName: 'Interior & Exterior Painting',
    categoryId: 'painter',
    masterId: 'master-5',
    masterName: 'Elena Rostova',
    masterAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    masterPhone: '+1 (555) 987-1234',
    scheduledDate: 'Friday, Oct 17',
    scheduledTime: '09:00 AM - 02:00 PM',
    address: '120 Broadway, Suite 1400, New York, NY',
    status: 'Confirmed',
    totalPrice: 320,
    paymentStatus: 'Paid',
    notes: 'Basecoat materials delivered already.',
    timeline: [
      { stage: 'Booking Request Placed', timestamp: 'Oct 10, 11:00 AM', completed: true },
      { stage: 'Craftsman Confirmed', timestamp: 'Oct 10, 11:15 AM', completed: true },
      { stage: 'Master En Route to Address', timestamp: 'Pending', completed: false },
      { stage: 'Work in Progress', timestamp: 'Pending', completed: false },
      { stage: 'Job Completed & Verified', timestamp: 'Pending', completed: false },
    ],
  },
  {
    id: 'b-103',
    bookingCode: 'UG-55201',
    serviceName: 'Tankless Water Heater Inspection & Flush',
    categoryName: 'Plumbing Services',
    categoryId: 'plumber',
    masterId: 'master-2',
    masterName: 'Marcus Vance',
    masterAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    masterPhone: '+1 (555) 456-7890',
    scheduledDate: 'Oct 04, 2026',
    scheduledTime: '02:00 PM - 03:30 PM',
    address: '742 Evergreen Terrace, Apt 4B, New York, NY',
    status: 'Completed',
    totalPrice: 150,
    paymentStatus: 'Paid',
    notes: 'Flushed descaling valve and replaced pressure filter.',
    timeline: [
      { stage: 'Booking Request Placed', timestamp: 'Oct 04, 01:00 PM', completed: true },
      { stage: 'Craftsman Confirmed', timestamp: 'Oct 04, 01:10 PM', completed: true },
      { stage: 'Master En Route to Address', timestamp: 'Oct 04, 01:45 PM', completed: true },
      { stage: 'Work in Progress', timestamp: 'Oct 04, 02:00 PM', completed: true },
      { stage: 'Job Completed & Verified', timestamp: 'Oct 04, 03:20 PM', completed: true },
    ],
  },
];

export const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Master En Route!',
    message: 'Alex Morgan has started navigation to your location (742 Evergreen Terrace). ETA 15 mins.',
    time: '10 mins ago',
    unread: true,
    type: 'booking',
  },
  {
    id: 'notif-2',
    title: 'Booking Confirmed',
    message: 'Elena Rostova confirmed your painting appointment for Oct 17.',
    time: '2 hours ago',
    unread: true,
    type: 'confirmation',
  },
  {
    id: 'notif-3',
    title: 'Special Autumn Offer!',
    message: 'Get 20% off deep home cleaning & AC servicing this weekend. Use code AUTUMN20.',
    time: '1 day ago',
    unread: false,
    type: 'promo',
  },
  {
    id: 'notif-4',
    title: 'Payment Receipt #UG-55201',
    message: 'Payment of $150.00 to Marcus Vance was successful.',
    time: '3 days ago',
    unread: false,
    type: 'payment',
  },
];

export const ADMIN_STATS = {
  totalRevenue: 284950,
  monthlyGrowth: 18.4,
  activeMasters: 1420,
  verifiedMastersPct: 96.5,
  totalBookingsThisMonth: 3840,
  completionRate: 99.2,
  averageRating: 4.91,
};

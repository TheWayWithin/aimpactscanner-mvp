# GTM Business Event Tracking Configuration for AImpactScanner

Configure these business events in your **GTM-WCQGG5N6** container for complete revenue tracking.

## 1. Create Custom Event Triggers in GTM

Go to **Triggers → New** and create these 5 triggers:

### A. Analysis Start Trigger
- **Trigger Configuration**: Custom Event
- **Event name**: `analysis_start`
- **Name**: "Website Analysis Started"

### B. Analysis Complete Trigger
- **Trigger Configuration**: Custom Event
- **Event name**: `analysis_complete`
- **Name**: "Website Analysis Completed"

### C. User Signup Trigger
- **Trigger Configuration**: Custom Event
- **Event name**: `sign_up`
- **Name**: "User Registration Complete"

### D. Coffee Tier Purchase Trigger
- **Trigger Configuration**: Custom Event
- **Event name**: `purchase`
- **Name**: "Coffee Tier Upgrade"

### E. Feature Usage Trigger
- **Trigger Configuration**: Custom Event
- **Event name**: `feature_usage`
- **Name**: "Feature Interaction"

## 2. Create Event Tags in GTM

Go to **Tags → New** and create these 5 event tags:

### A. Analysis Start Event Tag
- **Tag Configuration**: Google Analytics: GA4 Event
- **Measurement ID**: `G-EJ5M874QBZ`
- **Event Name**: `analysis_start`
- **Parameters**:
  - `analyzed_url`: {{analyzed_url}}
  - `user_tier`: {{user_tier}}
  - `event_category`: {{event_category}}
- **Triggering**: "Website Analysis Started" trigger

### B. Analysis Complete Event Tag
- **Tag Configuration**: Google Analytics: GA4 Event
- **Measurement ID**: `G-EJ5M874QBZ`
- **Event Name**: `analysis_complete`
- **Parameters**:
  - `analyzed_url`: {{analyzed_url}}
  - `analysis_score`: {{analysis_score}}
  - `analysis_duration`: {{analysis_duration}}
  - `user_tier`: {{user_tier}}
  - `event_category`: {{event_category}}
- **Triggering**: "Website Analysis Completed" trigger

### C. User Signup Event Tag
- **Tag Configuration**: Google Analytics: GA4 Event
- **Measurement ID**: `G-EJ5M874QBZ`
- **Event Name**: `sign_up`
- **Parameters**:
  - `method`: {{method}}
  - `tier`: {{tier}}
  - `event_category`: {{event_category}}
- **Triggering**: "User Registration Complete" trigger

### D. Coffee Tier Purchase Event Tag (Enhanced Ecommerce)
- **Tag Configuration**: Google Analytics: GA4 Event
- **Measurement ID**: `G-EJ5M874QBZ`
- **Event Name**: `purchase`
- **Parameters**:
  - `transaction_id`: {{transaction_id}}
  - `value`: {{value}}
  - `currency`: {{currency}}
  - `items`: {{items}}
- **Triggering**: "Coffee Tier Upgrade" trigger

### E. Feature Usage Event Tag
- **Tag Configuration**: Google Analytics: GA4 Event
- **Measurement ID**: `G-EJ5M874QBZ`
- **Event Name**: `feature_usage`
- **Parameters**:
  - `feature_name`: {{feature_name}}
  - `action`: {{action}}
  - `user_tier`: {{user_tier}}
  - `event_category`: {{event_category}}
- **Triggering**: "Feature Interaction" trigger

## 3. Configure Data Layer Variables

Go to **Variables → New** and create these user-defined variables:

### Required Variables for AImpactScanner Events:
- `analyzed_url` (Data Layer Variable)
- `analysis_score` (Data Layer Variable)
- `analysis_duration` (Data Layer Variable)
- `user_tier` (Data Layer Variable)
- `event_category` (Data Layer Variable)
- `method` (Data Layer Variable)
- `tier` (Data Layer Variable)
- `transaction_id` (Data Layer Variable)
- `value` (Data Layer Variable)
- `currency` (Data Layer Variable)
- `items` (Data Layer Variable)
- `feature_name` (Data Layer Variable)
- `action` (Data Layer Variable)

## 4. Revenue Tracking Setup

### Coffee Tier Purchase Event ($5 Value)
The purchase event for Coffee tier upgrades will track:
- **Revenue**: $5 per upgrade
- **Transaction ID**: Unique identifier
- **Product**: Coffee Tier subscription
- **Customer Journey**: Free → Coffee tier conversion

### Enhanced Ecommerce Data Structure
```javascript
// Example data layer push for Coffee tier purchase
window.dataLayer.push({
  event: 'purchase',
  transaction_id: 'upgrade_1629384756',
  value: 5,
  currency: 'USD',
  items: [{
    item_id: 'tier_coffee',
    item_name: 'Coffee Tier',
    category: 'subscription',
    quantity: 1,
    price: 5
  }]
});
```

## 5. Test the Setup

### Testing Process:
1. **Submit Changes**: Save all triggers and tags in GTM
2. **Publish Container**: Deploy the updated container
3. **Preview Mode**: Use GTM's preview mode for testing
4. **Real Testing**: 
   - Start a website analysis (should fire `analysis_start`)
   - Complete analysis (should fire `analysis_complete`)
   - Sign up for account (should fire `sign_up`)
   - Upgrade to Coffee tier (should fire `purchase` with $5 value)

### Verification:
- **GTM Preview**: All events should appear in preview console
- **GA4 Real-time**: Events should appear in GA4 real-time reports
- **GA4 Events**: Check Events section for custom event data
- **Revenue**: Coffee tier upgrades should appear in Monetization reports

## 6. Business Intelligence Benefits

Once configured, you'll have:
- **Conversion Funnel**: Track user journey from analysis → signup → upgrade
- **Revenue Attribution**: See which traffic sources drive Coffee tier upgrades
- **User Behavior**: Understand feature usage and engagement patterns
- **Performance Metrics**: Analysis completion rates and user satisfaction
- **Growth Insights**: Data-driven optimization opportunities

## Technical Notes

- All events are already implemented in the React application
- GTM data layer pushes are configured in `src/analytics/gtm-integration.jsx`
- Events fire automatically based on user actions
- Revenue tracking includes proper enhanced ecommerce data structure
- GDPR compliance maintained through Enzuzo consent management

**Result**: Complete business intelligence and revenue tracking for AImpactScanner with professional event configuration.
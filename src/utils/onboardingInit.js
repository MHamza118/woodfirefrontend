// Utility for onboarding pages - now handled via API
// TODO: Remove this file once onboarding content is fully API-driven

export const initializeOnboardingPages = () => {
  // TODO: This should fetch onboarding pages from API instead of localStorage
  console.log('Onboarding pages should be loaded from API')
}

export const getDefaultOnboardingPages = () => {
  return [
    {
      id: 'scheduling',
      title: 'Scheduling, Posting Availability & Checklists',
      icon: 'Calendar',
      content: `
        <h3>Scheduling Guidelines</h3>
        <p>As a team member, you are required to:</p>
        <ul>
          <li>Post your availability at least one week in advance</li>
          <li>Check your schedule regularly for updates</li>
          <li>Arrive 15 minutes before your scheduled shift</li>
          <li>Complete all opening/closing checklists as assigned</li>
          <li>Notify management immediately if you cannot work a scheduled shift</li>
        </ul>
        
        <h3>Availability Posting</h3>
        <p>You must update your availability through the scheduling system by Sunday at midnight for the following week.</p>
        
        <h3>Checklists</h3>
        <p>All opening and closing procedures must be completed and signed off before leaving your shift.</p>
      `,
      active: true,
      order: 1
    },
    {
      id: 'pay',
      title: 'Getting Paid & Tip Share',
      icon: 'Award',
      content: `
        <h2>Getting Paid & Tip Share System at 309+311 Properties</h2>
        
        <p>At 309+311, we believe in creating a collaborative and supportive environment where every team member, from front to back of house, contributes to delivering an exceptional guest experience. More importantly, we cultivate a positive work environment that encourages teamwork across the entire house, fostering a culture of respect and open communication, where constructive collaboration thrives.</p>
        
        <p>We pay every Friday. You will be paid one week after you initially start, then forward you receive a check through the payroll software as well as cash tips each week.</p>
        
        <p>To ensure fairness and recognize everyone's role, we implement a Tip Share system that distributes tips across all team members, reflecting our belief that every individual plays a critical part in making the customer experience outstanding.</p>
        
        <h3>What is a Tip Share?</h3>
        <p>A Tip Share system ensures that tips are shared among all team members who contribute to the overall dining experience, including both front and back of house. This recognizes that everyone, regardless of whether they interact with customers directly, is essential to delivering excellent service.</p>
        
        <h3>How Our Tip Share Works:</h3>
        
        <h4>Distribution to All Team Members:</h4>
        <p>Tips are shared between all staff, including:</p>
        <ul>
          <li><strong>Front of House Staff:</strong> Servers, bartenders, hosts, and bussers.</li>
          <li><strong>Back of House Staff:</strong> Kitchen staff, dishwashers, and other key members who ensure smooth operations behind the scenes.</li>
        </ul>
        
        <h3>Guaranteed Base Wage and Tip Share Distribution:</h3>
        <p>At 309+311 Properties, your guaranteed base wage is composed of your minimum wage and additional earnings from the tip share pool. Here's how it works:</p>
        
        <ul>
          <li>All tips collected throughout the week are first applied to cover the difference between minimum wage and your negotiated guaranteed base wage. This ensures that everyone receives the income they are guaranteed, based on their role, experience, and time with the company.</li>
          <li>If tips exceed the amount needed to cover everyone's guaranteed base wage, the remaining tips will be distributed as additional earnings across the team.</li>
          <li>In this way, your base wage is always met, and during busier weeks with higher tip volumes, everyone benefits from additional earnings beyond their guaranteed wage.</li>
        </ul>
        
        <h3>Payments and Distribution of Wages:</h3>
        <ul>
          <li><strong>Base Wage:</strong> All employees receive the minimum wage through their paycheck.</li>
          <li><strong>Tip Distribution:</strong> The rest of your wage, up to the guaranteed base, is covered by tips received throughout the week.</li>
          <li><strong>Additional Tips:</strong> Any tips beyond what's needed to cover guaranteed wages are distributed as bonus earnings.</li>
        </ul>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #e0f2fe; border: 1px solid #0277bd; border-radius: 8px;">
          <h4 style="color: #01579b; margin-bottom: 10px;">Key Benefits of Our System:</h4>
          <ul style="color: #01579b;">
            <li>Guaranteed minimum income regardless of tip volume</li>
            <li>Fair distribution recognizing all team contributions</li>
            <li>Incentive for teamwork and excellent service</li>
            <li>Transparent and equitable pay structure</li>
          </ul>
        </div>
      `,
      active: true,
      order: 2
    },
    {
      id: 'uniform',
      title: 'Uniform Guidelines',
      icon: 'User',
      content: `
        <h2>Uniform Guidelines for 309 + 311 Properties</h2>
        <p>As our company continues to expand, we aim to maintain a consistent and professional image across all our establishments. It is imperative that our employees not only deliver consistent service but also present themselves uniformly.</p>
        
        <h3>1. Palace Rooms</h3>
        <p><strong>Attire:</strong> Bartender, Host, or Bar Back positions are required to maintain business casual attire that reflects our establishment's upscale ambiance and contemporary style. This entails tastefully combining fashionable and trendy clothing items with a polished appearance. While we encourage individual style, attire should exude professionalism and sophistication, aligning with the upscale atmosphere of our venue.</p>
        
        <p><strong>Prohibited items:</strong></p>
        <ul>
          <li>Ripped jeans, leggings, sweatpants</li>
          <li>Face piercings limited to ears and small, discreet nose rings</li>
          <li>Tattoos are permitted, but any deemed inappropriate must be covered</li>
          <li>Closed-toe shoes are mandatory, and cleavage should not be visible</li>
          <li>No crop tops or graphic tees/logos from other companies</li>
        </ul>
        <p><strong>Note:</strong> Special events may require more formal attire.</p>
        
        <h3>2. Runners</h3>
        <p><strong>Roles:</strong> These roles serve both Palace Rooms and Lollipops.</p>
        <p><strong>Attire:</strong> Same as above for Palace Rooms attire, or all-black attire is acceptable, with the addition of a white or grey apron worn over the outside of clothing. Aprons should be clean and not wrinkled.</p>
        <p>Employees who transition between the two restaurants are encouraged to refrain from wearing Lollipops T-shirts whenever possible. While we acknowledge that there may be instances where this is unavoidable due to shift requirements, we prioritize maintaining distinct identities for each restaurant. Avoiding the crossover of Lollipops branding into Palace Rooms helps prevent customer confusion and ensures clarity in our restaurant identities.</p>
        
        <h3>3. Lollipops Register and Lollipops Lead</h3>
        <p><strong>Attire:</strong> Lollipops T-shirt paired with a grey or white apron.</p>
        <p>Typically, these employees do not move between the two restaurants.</p>
        
        <h3>4. Kitchen & Pizza Staff</h3>
        <p><strong>Attire:</strong> Lollipops T-shirt with a white apron.</p>
        <ul>
          <li>White aprons must be kept clean and remain within the building</li>
          <li>Jeans, black or khaki or similar pants, no sweatpants allowed in the kitchen</li>
          <li>Hair must be appropriately tied up or a ballcap must be worn over hair at all times (no beanies allowed)</li>
        </ul>
        
        <h3>Notes:</h3>
        <ul>
          <li>White aprons are mandatory and must be stored within the establishment. After use, they should be placed in a designated laundry area for cleaning.</li>
          <li>If a white apron is not available, a grey apron may be used, and vice versa.</li>
          <li>Employees are responsible for maintaining their uniform's cleanliness and adherence to these guidelines.</li>
        </ul>
        
        <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border: 2px solid #dee2e6; border-radius: 8px;">
          <h3 style="color: #495057; margin-bottom: 15px;">Acknowledgment</h3>
          <p style="color: #495057; margin-bottom: 15px;">By signing below, you acknowledge that you have read, understood, and agree to abide by these uniform guidelines while employed at 309 + 311 Properties. You understand that if you are not in your appropriate uniform, you will be written up and may be asked to leave your shift.</p>
        </div>
      `,
      active: true,
      order: 3
    },
    {
      id: 'conduct',
      title: 'Employee Conduct & No-Theft Policy',
      icon: 'FileText',
      content: `
        <h3>Professional Conduct</h3>
        <ul>
          <li>Treat all customers and coworkers with respect</li>
          <li>Maintain a positive, professional attitude</li>
          <li>Follow all safety and sanitation procedures</li>
          <li>Report any incidents immediately to management</li>
        </ul>
        
        <h3>Zero Tolerance Policy</h3>
        <p>The following behaviors will result in immediate termination:</p>
        <ul>
          <li>Theft of any kind (money, food, supplies)</li>
          <li>Harassment or discrimination</li>
          <li>Violation of alcohol service laws</li>
          <li>Working under the influence of drugs or alcohol</li>
        </ul>
        
        <h3>Disciplinary Process</h3>
        <p>Progressive discipline includes verbal warning, written warning, suspension, and termination.</p>
      `,
      active: true,
      order: 4
    },
    {
      id: 'food',
      title: 'Food/Break Announcements',
      icon: 'Bell',
      content: `
        <h2>Food & Break Announcement</h2>
        
        <h3>Food Policies</h3>
        <ul>
          <li><strong>No Mess Up Shelf of Food</strong> – All mess-ups go in a to-go box and must be labeled on the box with what happened and the initials of who is responsible. Place the mess under the dry erase board.</li>
          <li><strong>No walking around kitchen eating food</strong></li>
          <li><strong>Eat food only on a break</strong></li>
          <li><strong>Check out with a manager for any breaks</strong></li>
          <li><strong>Clock out during food break</strong></li>
        </ul>
        
        <h3>Break Policies</h3>
        <ul>
          <li><strong>No breaks during rush:</strong> 11 AM – 2 PM & 6 PM – 8 PM</li>
          <li><strong>Breaks not allowed on shifts 4 hours and under</strong> (unless emergency – see manager)</li>
          <li><strong>Do not take breaks with other co-workers</strong></li>
        </ul>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px;">
          <h4 style="color: #92400e; margin-bottom: 10px;">Important Reminders:</h4>
          <ul style="color: #92400e;">
            <li>Always check with management before taking any break</li>
            <li>Respect rush hour restrictions</li>
            <li>Properly label and store any food mistakes</li>
            <li>Keep work areas clean and professional</li>
          </ul>
        </div>
      `,
      active: true,
      order: 5
    },
    {
      id: 'safety',
      title: 'Food Safety Quiz',
      icon: 'BookOpen',
      content: `
        <h3>Food Safety Requirements</h3>
        <p>All employees must pass a food safety quiz before handling food.</p>
        
        <h3>Key Points to Remember:</h3>
        <ul>
          <li>Wash hands frequently and thoroughly</li>
          <li>Maintain proper food temperatures</li>
          <li>Use separate cutting boards for different food types</li>
          <li>Store food at proper temperatures</li>
          <li>Report any illness immediately</li>
        </ul>
        
        <h3>Quiz Requirements</h3>
        <p>You must score 80% or higher on the food safety quiz. The quiz may be retaken if necessary.</p>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
          <h4>Sample Questions:</h4>
          <p><strong>Q:</strong> What is the danger zone temperature range?</p>
          <p><strong>A:</strong> 41°F - 135°F</p>
          
          <p><strong>Q:</strong> How long should you wash your hands?</p>
          <p><strong>A:</strong> At least 20 seconds</p>
        </div>
      `,
      active: true,
      order: 6
    }
  ]
}

// Function to ensure onboarding pages are available at application startup
export const ensureOnboardingPagesExist = () => {
  try {
    // TODO: Replace with API call to fetch onboarding content
    console.log('Onboarding pages existence check - should use API')
    return true
  } catch (error) {
    console.error('Failed to check onboarding pages:', error)
    return false
  }
}

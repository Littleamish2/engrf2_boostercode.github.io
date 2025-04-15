# All copied from optimization code made with jupyter notebook

import numpy as np

specific_impulse = 250 # seconds
g = 9.80665 # m / s^2
v_eq = g*specific_impulse
meters_to_inches = 39.3700787402 ## multiply to meters
kg_to_lbs = 2.20462
payload = 250 * kg_to_lbs  ## in lbs

#m0 / mf
mass_frac_first = 1/np.linspace(0.0400, 0.1200)
mass_frac_second = 1/np.linspace(.0450, 0.1700) 
mass_frac_third = 1/np.linspace(.0800, 0.1010)
max_mf1 = np.max(mass_frac_first)
max_mf2 = np.max(mass_frac_second)
max_mf3 = np.max(mass_frac_third)
deltav_first = np.log(mass_frac_first) * v_eq
deltav_second = np.log(mass_frac_second) * v_eq
deltav_third = np.log(mass_frac_third) * v_eq
deltav_total_max = np.max(deltav_first)+np.max(deltav_second)+np.max(deltav_third)
print(
"Unitless values.\nMax Mass Fraction\n"
    "\tFirst: ", max_mf1, "\n\tSecond: ", max_mf2, "\n\tThird: ", max_mf3)
print(
"\n\nUnits in meters per second.\nMax Delta V\n",
    "\tFirst: ", np.max(deltav_first), "\n\tSecond: ", np.max(deltav_second), "\n\tThird: ", np.max(deltav_third),
"\n\nTotal Delta V: ", deltav_total_max)

## Constants given in project
total_length = 10.0 * 39.3700787402
diameter = 1.0 * 39.3700787402 ## convert given meters to inches (final unit inches)
launch_weight = 0.04 * total_length * (diameter)*(diameter) ## pounds
print(launch_weight, "lbs")
print(launch_weight/2.205, "kg")

## Lengths in ratio form
l1_ratio = np.linspace(0.1, 1, 100)
l2_ratio = np.linspace(0.1, 1, 100)
print(np.round(l1_ratio*10, 1)) ## lengths corresponding to l1's ratio, rounded to tenths

## Create new data type to hold a tuple in each element of the array (makes adding elements easier)
##length 1 ratio, length 2 ratio, length 3 ratio
dt = np.dtype([('l1r', np.float64), ('l2r', np.float64), ('l3r', np.float64)])

## Test dt to make sure it works as expected
test = np.array([(1,2,3), (1,3,4)], dtype = dt)
print(test)
np.append(test, np.array([(4.,4.,2.)], dtype = dt))

## Find all possible ratio combos between the three stages, put it in an np array of tuples
ratio_list = np.array([], dtype=dt )
for i in l1_ratio:
    for j in l2_ratio:
        if(i+j > 1):
            continue
        else:
            ratio_list = np.append(ratio_list, np.array([(i, j, 1-i-j)], dtype = dt)) 
            
## convert the np array of tuples to a more useful np array of 3 columns and each row representing a tuple of 
## the ratios
ratio_list_converted = np.array([])
for i in ratio_list:
    ratio_list_converted = np.append(ratio_list_converted, np.array([[i[0], i[1], i[2]]]))
    
ratio_list_converted = np.reshape(ratio_list_converted, (-1, 3)).astype(np.float64)

##np.set_printoptions(threshold=np.inf) - to see ENTIRE list
print(np.round(ratio_list_converted*10, 2), "\n")
print(ratio_list_converted.shape)

## 4005 different combinations!

##now we calculate masses
launch_weights = 0.04 * (10 * ratio_list_converted * meters_to_inches) * diameter * diameter + payload ## lbs 
final_masses = launch_weights*.22 + payload ## after losing the propellant

test1 = np.array([[0, 2], [4,5]])
print(np.sum(test1, axis = 1))

## now mass fractions - m0/mf
stage_1_mf = np.sum(launch_weights, axis = 1)/(np.sum(launch_weights[:, 1:2], axis=1) + final_masses[:, 0])
stage_2_mf = np.sum(launch_weights[:, 1:2], axis = 1)/(launch_weights[:, 2] + final_masses[:, 1])
stage_3_mf = launch_weights[:, 2]/final_masses[:, 2]

## Calculate mass fractions by taking initial launch weight / final masses of the lowest stage
mass_fractions = np.stack((stage_1_mf, stage_2_mf, stage_3_mf), axis = 1)
print(mass_fractions.shape)
print(mass_fractions[:, 0])
print(stage_1_mf)
print(mass_fractions[:, 1])
print(stage_2_mf)
print(mass_fractions[:, 2])
print(stage_3_mf)

## now delta vs
delta_v = np.log(mass_fractions) * v_eq 
delta_v.shape
## and quickly sum for total delta vs
delta_v = np.sum(delta_v, axis = 1)

## Now find best performing mass fractions
print(delta_v)
print(np.max(delta_v))
print(np.argmax(delta_v))
best_performing_index = np.argmax(delta_v)
print(mass_fractions[best_performing_index, :])

# Find the indices that would sort delta_v in descending order
sorted_indices = np.argsort(delta_v)[::-1]

# Select how many top-performing configurations you want to see
top_n = 100

# Print top 10 delta-v values
print("Top 10 delta-v values:")
for idx in sorted_indices[:10]:
    print(delta_v[idx])

# Print top 100 delta-v values and their corresponding mass fractions
print("\nTop 100 delta-v values and their corresponding mass fractions:")
for idx in sorted_indices[:top_n]:
    print(delta_v[idx])
    print(mass_fractions[idx])
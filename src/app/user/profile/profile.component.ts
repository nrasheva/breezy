import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { UserService } from '../user.service';
import { Location } from 'src/app/types/Location';
import { AirQualityServiceService } from 'src/app/shared/services/air-quality-service.service';
import { AirQualityData } from 'src/app/types/AirQualityData';
import {
  faTree,
  faLeaf,
  faClover,
  faSeedling,
  faCannabis,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { faPagelines } from '@fortawesome/free-brands-svg-icons';
import { LocationCoordinatesService } from 'src/app/shared/services/location-coordinates.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  currentLocation: Location | null = null;
  isEditing = false;
  editableLocation = '';

  faTree = faTree;
  faLeaf = faLeaf;
  faClover = faClover;
  faPagelines = faPagelines;
  faSeedling = faSeedling;
  faCannabis = faCannabis;
  faXmark = faXmark;

  private locationSubscription: Subscription | undefined;

  airQualityData?: AirQualityData | null;
  private subscription: Subscription = new Subscription();

  private coordinatesSubscription?: Subscription;

  constructor(
    private userService: UserService,
    private airQualityService: AirQualityServiceService,
    private locationCoordinatesService: LocationCoordinatesService
  ) {}

  ngOnInit(): void {
    this.locationSubscription = this.userService
      .getCurrentLocation()
      .subscribe(location => {
        this.currentLocation = location;
      });

    this.initUserProfile();
  }

  initUserProfile(): void {
    // Fetch user's profile to get the location (as a string, for instance)
    this.userService.getCurrentLocation().subscribe(profileLocation => {
      if (profileLocation) {
        // Assuming profileLocation.location is a string like "New York, NY"
        this.locationCoordinatesService.fetchLocationCoordinates(
          profileLocation.location
        );

        // Now, subscribe to the location data changes
        this.coordinatesSubscription =
          this.locationCoordinatesService.currentLocationData.subscribe({
            next: ({ latitude, longitude }) => {
              if (latitude && longitude) {
                // With valid coordinates, fetch the air quality data
                this.fetchAirQualityDataForLocation(latitude, longitude);
              }
            },
            error: error =>
              console.error('Error getting location data:', error),
          });
      }
    });
  }

  fetchAirQualityDataForLocation(lat: number, lon: number): void {
    this.airQualityService.fetchAirQuality(lat, lon).subscribe({
      next: data => {
        this.airQualityData = data;
      },
      error: error => {
        console.error('Error fetching air quality data:', error);
      },
    });
  }

  startEditing(): void {
    this.isEditing = true;
  }

  stopEditing(): void {
    this.isEditing = false;
  }

  updateLocation(): void {
    const currentLocation = this.currentLocation;

    if (currentLocation && this.editableLocation.trim()) {
      this.userService
        .editLocation(currentLocation._id, this.editableLocation)
        .subscribe(
          () => {
            console.log('Location updated successfully');
            if (currentLocation) {
              currentLocation.location = this.editableLocation;

              localStorage.setItem(
                'currentLocation',
                JSON.stringify(currentLocation)
              );

              this.userService.setCurrentLocation(currentLocation);
            }

            this.isEditing = false; // Exit editing mode
          },
          error => {
            console.error('Error updating location:', error);
          }
        );
    }
  }

  deleteLocation(locationId: string): void {
    this.userService.deleteLocation(locationId).subscribe({
      next: () => {
        // Handle successful deletion
        console.log('Location deleted successfully.');
      },
      error: error => {
        // Handle error
        console.error('Error deleting location:', error);
      },
    });
  }

  ngOnDestroy(): void {
    if (this.locationSubscription) {
      this.locationSubscription.unsubscribe();
      this.coordinatesSubscription?.unsubscribe();
    }
  }
}
